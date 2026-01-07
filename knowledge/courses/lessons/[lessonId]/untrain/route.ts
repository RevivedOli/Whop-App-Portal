import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/admin/knowledge/courses/lessons/[lessonId]/untrain
 * 
 * Untrains a lesson by deleting it from the database.
 * The Supabase trigger will automatically call the n8n webhook for deletion.
 * 
 * Request body:
 * {
 *   companyId: string;
 *   courseId: string;
 *   chapterId?: string | null;
 * }
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Request received');

	try {
		const { lessonId } = await params;
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/untrain] Authentication failed');
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const {
			companyId: companyIdFromBody,
			courseId,
			chapterId,
		} = body;

		const companyId = companyIdFromBody || tokenData.companyId;

		if (!companyId || !courseId || !lessonId) {
			return Response.json(
				{ error: 'Missing required fields: companyId, courseId, lessonId' },
				{ status: 400 },
			);
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Untraining lesson', {
			companyId,
			lessonId,
			courseId,
			chapterId,
		});

		const supabase = createSupabaseClient();

		// Check if the lesson exists and is trained
		const { data: existingLesson, error: fetchError } = await supabase
			.from('courses')
			.select('*')
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.single();

		if (fetchError) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/untrain] Error fetching lesson:', fetchError);
			return Response.json(
				{ error: 'Lesson not found', details: fetchError.message },
				{ status: 404 },
			);
		}

		if (existingLesson.status !== 'trained') {
			return Response.json(
				{ error: 'Only trained lessons can be untrained' },
				{ status: 400 },
			);
		}

		// Store lesson data before deletion for webhook payload
		const lessonData = existingLesson;

		// Delete files from Supabase Storage before deleting the database record
		const filesToDelete: string[] = [];

		// Extract transcription file path if it exists
		if (existingLesson.transcription_file) {
			// Extract path from URL: https://[project].supabase.co/storage/v1/object/public/transcriptions/[companyId]/[lessonId].vtt
			// We need: [companyId]/[lessonId].vtt
			const transcriptionUrl = existingLesson.transcription_file;
			console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Transcription URL:', transcriptionUrl);
			
			// Try multiple patterns to extract the path
			let filePath: string | null = null;
			
			// Pattern 1: /transcriptions/[path]
			const match1 = transcriptionUrl.match(/\/transcriptions\/([^/?]+)/);
			if (match1) {
				filePath = match1[1];
			} else {
				// Pattern 2: storage/v1/object/public/transcriptions/[path]
				const match2 = transcriptionUrl.match(/storage\/v1\/object\/public\/transcriptions\/([^/?]+)/);
				if (match2) {
					filePath = match2[1];
				}
			}
			
			if (filePath) {
				filesToDelete.push(filePath);
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Extracted transcription file path:', filePath);
			} else {
				// Fallback: construct path from known structure
				const fallbackPath = `${companyId}/${lessonId}.vtt`;
				filesToDelete.push(fallbackPath);
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Using fallback transcription path:', fallbackPath, '(original URL:', transcriptionUrl, ')');
			}
		}

		// Extract summary PDF path if it exists
		if (existingLesson.lesson_summary_pdf) {
			// Extract path from URL: https://[project].supabase.co/storage/v1/object/public/transcriptions/[companyId]/[lessonId]-summary.pdf
			// We need: [companyId]/[lessonId]-summary.pdf
			const pdfUrl = existingLesson.lesson_summary_pdf;
			console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] PDF URL:', pdfUrl);
			
			// Try multiple patterns to extract the path
			let filePath: string | null = null;
			
			// Pattern 1: /transcriptions/[path]
			const match1 = pdfUrl.match(/\/transcriptions\/([^/?]+)/);
			if (match1) {
				filePath = match1[1];
			} else {
				// Pattern 2: storage/v1/object/public/transcriptions/[path]
				const match2 = pdfUrl.match(/storage\/v1\/object\/public\/transcriptions\/([^/?]+)/);
				if (match2) {
					filePath = match2[1];
				}
			}
			
			if (filePath) {
				filesToDelete.push(filePath);
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Extracted PDF file path:', filePath);
			} else {
				// Fallback: construct path from known structure
				const fallbackPath = `${companyId}/${lessonId}-summary.pdf`;
				filesToDelete.push(fallbackPath);
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Using fallback PDF path:', fallbackPath, '(original URL:', pdfUrl, ')');
			}
		}

		// Delete files from storage
		if (filesToDelete.length > 0) {
			console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Attempting to delete files from storage:', {
				files: filesToDelete,
				transcription_file: existingLesson.transcription_file,
				lesson_summary_pdf: existingLesson.lesson_summary_pdf,
			});
			
			const { data: deleteData, error: storageError } = await supabase.storage
				.from('transcriptions')
				.remove(filesToDelete);

			if (storageError) {
				console.error(
					'[admin/knowledge/courses/lessons/[lessonId]/untrain] ERROR deleting files from storage:',
					{
						error: storageError,
						message: storageError.message,
						statusCode: (storageError as any).statusCode,
						filesAttempted: filesToDelete,
					}
				);
				// Return error details in response so user can see what went wrong
				return Response.json(
					{ 
						error: 'Failed to delete files from storage',
						details: storageError.message,
						storageError: storageError,
						filesAttempted: filesToDelete,
					},
					{ status: 500 },
				);
			} else {
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Successfully deleted files from storage:', {
					deletedFiles: deleteData,
					filesRequested: filesToDelete,
				});
			}
		} else {
			console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] No files to delete from storage');
		}

		// Delete the lesson record
		const { error: deleteError } = await supabase
			.from('courses')
			.delete()
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId);

		if (deleteError) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/untrain] Database error:', deleteError);
			return Response.json(
				{ error: 'Failed to delete lesson', details: deleteError.message },
				{ status: 500 },
			);
		}

		// Call n8n webhook to notify about the deletion
		const webhookUrl = 'https://automations.revivedleads.ai/webhook/whop-ai/delete-training';
		const webhookPayload = {
			action: 'delete',
			id: lessonData.id,
			whop_company_id: lessonData.whop_company_id,
			course_id: lessonData.course_id,
			chapter_id: lessonData.chapter_id,
			lesson_id: lessonData.lesson_id,
			video_id: lessonData.video_id,
			playback_id: lessonData.playback_id,
			title: lessonData.title,
			status: lessonData.status,
			metadata: lessonData.metadata,
			company_slug: lessonData.company_slug,
			experience_id: lessonData.experience_id,
			lesson_url: lessonData.lesson_url,
			trained_at: lessonData.trained_at,
		};

		try {
			console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Calling n8n webhook...');
			const webhookResponse = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(webhookPayload),
			});

			if (!webhookResponse.ok) {
				console.warn(
					'[admin/knowledge/courses/lessons/[lessonId]/untrain] Webhook call failed:',
					webhookResponse.status,
					webhookResponse.statusText
				);
				// Don't fail the request if webhook fails - the Supabase trigger will also try
			} else {
				console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Webhook called successfully');
			}
		} catch (webhookError) {
			console.error(
				'[admin/knowledge/courses/lessons/[lessonId]/untrain] Error calling webhook:',
				webhookError
			);
			// Don't fail the request if webhook fails - the Supabase trigger will also try
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/untrain] Lesson deleted successfully');
		return Response.json({ success: true, message: 'Lesson untrained and deleted successfully' });
	} catch (error) {
		console.error('[admin/knowledge/courses/lessons/[lessonId]/untrain] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

