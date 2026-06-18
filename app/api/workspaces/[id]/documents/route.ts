import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClientFromRequest } from "@/lib/db/server";
import { getGenerativeModel } from "@/lib/gemini";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Helper for text chunking
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let index = 0;
  const normalizedText = text.replace(/\s+/g, " ").trim();

  while (index < normalizedText.length) {
    const chunk = normalizedText.substring(index, index + chunkSize);
    chunks.push(chunk);
    index += chunkSize - overlap;
  }
  return chunks;
}

// GET: List documents in the workspace
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await props.params;

    // Tenancy Check
    const { client: supabase, user } = await createClientFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });

    if (roleError || !hasRole) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: documents });
  } catch (err: any) {
    console.error("[Documents API GET] Exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Upload a document and parse/chunk/embed it
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await props.params;

    // Tenancy Check
    const { client: supabase, user } = await createClientFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    // Enforce document limit
    const { checkUsageLimit } = await import("@/app/billing-actions");
    const limitCheck = await checkUsageLimit("document", workspaceId, user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data or application/x-www-form-urlencoded" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file found in request form data" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type;

    // 1. Ensure Supabase Storage bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "knowledge-base");
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket("knowledge-base", {
        public: false,
        allowedMimeTypes: ["application/pdf", "text/plain", "application/json", "text/markdown"],
        fileSizeLimit: 10 * 1024 * 1024,
      });
    }

    // 2. Upload file to Storage
    const storagePath = `${workspaceId}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("knowledge-base")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Insert documents tracker row
    const { data: docRecord, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({
        workspace_id: workspaceId,
        name: fileName,
        file_path: storagePath,
        file_size: fileSize,
        mime_type: mimeType,
      })
      .select("id")
      .single();

    if (docError || !docRecord) {
      // Cleanup file from storage
      await supabaseAdmin.storage.from("knowledge-base").remove([storagePath]);
      throw new Error(`Database document insert failed: ${docError?.message}`);
    }

    const documentId = docRecord.id;

    // 4. Extract Text Content
    let extractedText = "";
    if (mimeType === "application/pdf") {
      try {
        const pdfModule = await import("pdf-parse");
        const PDFParser = pdfModule.PDFParse || (pdfModule as any).default || pdfModule;

        // Set worker if supported (necessary for modern pdf-parse versions in Next.js bundled environment on Windows)
        if (PDFParser && typeof PDFParser.setWorker === 'function') {
          try {
            const { pathToFileURL } = await import("url");
            const path = await import("path");
            const fs = await import("fs");

            let workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
            if (!fs.existsSync(workerPath)) {
              workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs");
            }

            const workerUrl = pathToFileURL(workerPath).href;
            PDFParser.setWorker(workerUrl);
            console.log("[Documents API] Configured PDFParse worker URL:", workerUrl);
          } catch (workerErr: any) {
            console.warn("[Documents API] Failed to configure worker URL:", workerErr.message);
          }
        }

        if (typeof PDFParser === 'function') {
          try {
            // Attempt instantiation (needed for class-based modern libraries)
            const parser = new (PDFParser as any)({ data: buffer });
            const pdfData = await parser.getText();
            extractedText = pdfData.text;
          } catch (instErr: any) {
            console.warn("[Documents API] Class instantiation fallback triggered:", instErr.message);
            // Fallback to calling as a function (needed for legacy pdf-parse)
            const pdfData = await (PDFParser as any)(buffer);
            extractedText = pdfData.text || pdfData;
          }
        } else {
          throw new Error("Could not find a valid parser function or class in pdf-parse module.");
        }
      } catch (err: any) {
        console.error("[Documents API] PDF parsing error:", err);
        throw new Error(`PDF parsing failed: ${err.message}`);
      }
    } else {
      // Fallback for text/markdown/json files
      extractedText = buffer.toString("utf8");
    }

    if (!extractedText.trim()) {
      throw new Error("No readable text found in document.");
    }

    // 5. Chunk Text
    const chunks = chunkText(extractedText);
    console.log(`[Documents API] Document split into ${chunks.length} chunks.`);

    // 6. Embed and Index chunks in pgvector
    const embedModel = getGenerativeModel("text-embedding-004");
    let successfulEmbeddings = 0;
    const totalChunks = chunks.length;
    
    // Concurrently embed chunks in batches of 5 to avoid overloading rate limits
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (chunk, batchIdx) => {
          const chunkIdx = i + batchIdx;
          try {
            const embedResult = await embedModel.embedContent(chunk);
            const embedding = embedResult.embedding.values;

            const { error: insertErr } = await supabaseAdmin.from("vector_memories").insert({
              workspace_id: workspaceId,
              content: chunk,
              embedding: embedding,
              metadata: {
                source: "document",
                document_id: documentId,
                document_name: fileName,
                chunk_index: chunkIdx,
              },
            });

            if (insertErr) throw insertErr;
            successfulEmbeddings++;
          } catch (embedErr) {
            console.error(`[Documents API] Embedding fail on chunk ${chunkIdx}:`, embedErr);
            // Skip failed chunks instead of aborting the entire document
          }
        })
      );
    }

    const successRate = totalChunks > 0 ? successfulEmbeddings / totalChunks : 0;
    
    if (successRate < 0.8) {
      // Cleanup: delete from storage
      await supabaseAdmin.storage.from("knowledge-base").remove([storagePath]);
      // Cleanup: delete vector memories inserted so far
      await supabaseAdmin.from("vector_memories").delete().eq("workspace_id", workspaceId).filter("metadata->>document_id", "eq", documentId);
      // Cleanup: delete document record
      await supabaseAdmin.from("documents").delete().eq("id", documentId);
      
      return NextResponse.json({
        error: `Document processing failed. Indexing success rate (${Math.round(successRate * 100)}%) fell below required threshold (80%).`
      }, { status: 500 });
    }

    // 7. Log workspace event to timeline
    await supabaseAdmin.from("workspace_events").insert({
      workspace_id: workspaceId,
      event_type: "document",
      title: "Document Uploaded",
      description: successRate < 1.0 
        ? `Uploaded and partially indexed "${fileName}" (${(fileSize / 1024).toFixed(1)} KB) with warnings.`
        : `Uploaded and indexed "${fileName}" (${(fileSize / 1024).toFixed(1)} KB) in the knowledge base.`,
      metadata: { document_id: documentId, name: fileName, size: fileSize, success_rate: successRate },
    });

    return NextResponse.json({
      success: true,
      message: `Document "${fileName}" successfully processed and vectorized.`,
      documentId,
      warning: successRate < 1.0 ? 'Some chunks failed to index. Partial document context available.' : undefined
    });
  } catch (err: any) {
    console.error("[Documents API POST] Exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error during upload" }, { status: 500 });
  }
}

// DELETE: Remove a document and its embeddings
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await props.params;

    // Tenancy Check
    const { client: supabase, user } = await createClientFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId parameter" }, { status: 400 });
    }

    // Fetch document record
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("knowledge-base")
      .remove([doc.file_path]);

    if (storageError) {
      console.warn("[Documents API DELETE] Storage delete warning:", storageError.message);
    }

    // 2. Delete chunks from vector_memories (using filter for document_id in jsonb metadata)
    const { error: vectorError } = await supabaseAdmin
      .from("vector_memories")
      .delete()
      .eq("workspace_id", workspaceId)
      .filter("metadata->>document_id", "eq", documentId);

    if (vectorError) {
      console.error("[Documents API DELETE] Chunks delete error:", vectorError.message);
    }

    // 3. Delete document row (cascades)
    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      throw new Error(`Database delete failed: ${deleteError.message}`);
    }

    // 4. Log event to timeline
    await supabaseAdmin.from("workspace_events").insert({
      workspace_id: workspaceId,
      event_type: "document",
      title: "Document Removed",
      description: `Removed "${doc.name}" from the workspace knowledge base.`,
      metadata: { name: doc.name },
    });

    return NextResponse.json({ success: true, message: `Document "${doc.name}" successfully deleted.` });
  } catch (err: any) {
    console.error("[Documents API DELETE] Exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error during deletion" }, { status: 500 });
  }
}
