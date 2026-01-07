import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/admin/knowledge/courses/lessons/[lessonId]/keep-orphaned
 * 
 * Marks an orphaned lesson as "kept" so it no longer shows in the orphaned section.
 * This updates the metadata to indicate the lesson is intentionally kept in AI memory
 * even though it's no longer in the Whop course.
 * 
 * Request body:
 * {
 *   companyId: string;
 * }
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Request received');

	try {
		const { lessonId } = await params;
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Authentication failed');
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { companyId: companyIdFromBody } = body;
		const companyId = companyIdFromBody || tokenData.companyId;

		if (!companyId || !lessonId) {
			return Response.json(
				{ error: 'Missing required fields: companyId, lessonId' },
				{ status: 400 },
			);
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Marking lesson as kept', {
			companyId,
			lessonId,
		});

		const supabase = createSupabaseClient();

		// Fetch the current lesson record
		const { data: existingLesson, error: fetchError } = await supabase
			.from('courses')
			.select('*')
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.single();

		if (fetchError) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Error fetching lesson:', fetchError);
			return Response.json(
				{ error: 'Lesson not found', details: fetchError.message },
				{ status: 404 },
			);
		}

		// Update metadata to mark as kept
		const updatedMetadata = {
			...(existingLesson.metadata || {}),
			is_orphaned_kept: true,
			orphaned_kept_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('courses')
			.update({
				metadata: updatedMetadata,
				updated_at: new Date().toISOString(),
			})
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.select()
			.single();

		if (error) {
			console.error('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Database error:', error);
			return Response.json(
				{ error: 'Failed to update lesson', details: error.message },
				{ status: 500 },
			);
		}

		console.log('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Lesson marked as kept successfully');
		return Response.json({ success: true, data });
	} catch (error) {
		console.error('[admin/knowledge/courses/lessons/[lessonId]/keep-orphaned] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}




