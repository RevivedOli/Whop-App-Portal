import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/admin/knowledge/courses/lessons/[lessonId]/update
 * 
 * Updates the metadata for a trained lesson.
 * 
 * Request body:
 * {
 *   companyId: string;
 *   courseId: string;
 *   chapterId?: string | null;
 *   metadata: Record<string, any>;
 * }
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[admin/knowledge/courses/lessons/[lessonId]/update] Request received');

	try {
		const { lessonId } = await params;
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/update] Authentication failed');
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
			metadata,
		} = body;

		const companyId = companyIdFromBody || tokenData.companyId;

		if (!companyId || !courseId || !lessonId || !metadata) {
			return Response.json(
				{ error: 'Missing required fields: companyId, courseId, lessonId, metadata' },
				{ status: 400 },
			);
		}

		// Validate metadata is an object
		if (typeof metadata !== 'object' || Array.isArray(metadata)) {
			return Response.json(
				{ error: 'Metadata must be an object' },
				{ status: 400 },
			);
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/update] Updating metadata', {
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
			console.error('[admin/knowledge/courses/lessons/[lessonId]/update] Error fetching lesson:', fetchError);
			return Response.json(
				{ error: 'Lesson not found', details: fetchError.message },
				{ status: 404 },
			);
		}

		if (existingLesson.status !== 'trained') {
			return Response.json(
				{ error: 'Only trained lessons can be updated' },
				{ status: 400 },
			);
		}

		// Update the metadata
		const { data, error } = await supabase
			.from('courses')
			.update({
				metadata: metadata,
				updated_at: new Date().toISOString(),
			})
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.select()
			.single();

		if (error) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/update] Database error:', error);
			return Response.json(
				{ error: 'Failed to update lesson metadata', details: error.message },
				{ status: 500 },
			);
		}

		// Call n8n webhook to notify about the update
		const webhookUrl = 'https://automations.revivedleads.ai/webhook/whop-ai/update-training';
		const webhookPayload = {
			action: 'update',
			id: data.id,
			whop_company_id: data.whop_company_id,
			course_id: data.course_id,
			chapter_id: data.chapter_id,
			lesson_id: data.lesson_id,
			video_id: data.video_id,
			playback_id: data.playback_id,
			title: data.title,
			status: data.status,
			metadata: data.metadata,
			company_slug: data.company_slug,
			experience_id: data.experience_id,
			lesson_url: data.lesson_url,
			trained_at: data.trained_at,
			updated_at: data.updated_at,
		};

		try {
			console.log('[admin/knowledge/courses/lessons/[lessonId]/update] Calling n8n webhook...');
			const webhookResponse = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(webhookPayload),
			});

			if (!webhookResponse.ok) {
				console.warn(
					'[admin/knowledge/courses/lessons/[lessonId]/update] Webhook call failed:',
					webhookResponse.status,
					webhookResponse.statusText
				);
				// Don't fail the request if webhook fails - the Supabase trigger will also try
			} else {
				console.log('[admin/knowledge/courses/lessons/[lessonId]/update] Webhook called successfully');
			}
		} catch (webhookError) {
			console.error(
				'[admin/knowledge/courses/lessons/[lessonId]/update] Error calling webhook:',
				webhookError
			);
			// Don't fail the request if webhook fails - the Supabase trigger will also try
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/update] Metadata updated successfully');
		return Response.json({ success: true, data });
	} catch (error) {
		console.error('[admin/knowledge/courses/lessons/[lessonId]/update] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

