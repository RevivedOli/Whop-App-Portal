import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';
import { createSupabaseClient } from '@/lib/supabase';
import type { CourseWithTrainingStatus, CourseTrainingStatus } from '@/lib/types';

/**
 * GET /api/admin/knowledge/courses
 * 
 * Returns all courses for the company with their training status.
 * Fetches courses from Whop API and merges with training status from Supabase.
 */
export async function GET(request: Request): Promise<Response> {
	console.log('[admin/knowledge/courses] Request received');

	try {
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses] Authentication failed');
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			);
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const companyIdFromParams = searchParams.get('companyId');
		const companyId = companyIdFromParams || tokenData.companyId;

		if (!companyId) {
			return Response.json(
				{ error: 'Company ID is required' },
				{ status: 400 },
			);
		}

		console.log('[admin/knowledge/courses] Fetching courses for company:', companyId);

		// Fetch company details to get the route (slug)
		let companySlug: string | null = null;
		let coursesExperienceId: string | null = null;
		
		try {
			// First, fetch company details to get the route/slug using user-specific SDK
			const company = await tokenData.whop.companies.retrieve(companyId);
			companySlug = company?.route || null;
			console.log('[admin/knowledge/courses] Company details:', {
				companyId,
				companySlug,
				companyTitle: company?.title,
			});
		} catch (error) {
			console.error('[admin/knowledge/courses] Error fetching company details:', error);
		}
		
		// Find the Courses app experience for this company
		try {
			const experiencesResponse = await tokenData.whop.experiences.list({
				company_id: companyId,
			});
			
			console.log('[admin/knowledge/courses] Raw experiences response:', JSON.stringify(experiencesResponse, null, 2));
			console.log('[admin/knowledge/courses] Experiences data array:', experiencesResponse.data);
			console.log('[admin/knowledge/courses] Number of experiences:', experiencesResponse.data?.length || 0);
			
			// Log each experience in detail
			if (experiencesResponse.data && experiencesResponse.data.length > 0) {
				experiencesResponse.data.forEach((exp, index) => {
					console.log(`[admin/knowledge/courses] Experience ${index + 1}:`, {
						id: exp.id,
						name: exp.name,
						app: exp.app,
						appId: exp.app?.id,
						appName: exp.app?.name,
						company: exp.company,
						fullObject: JSON.stringify(exp, null, 2),
					});
				});
			} else {
				console.warn('[admin/knowledge/courses] No experiences found in response');
			}
			
			// Find the experience with appName === "Courses"
			// Note: We search by appName instead of app.id because the app ID can vary
			const coursesExperience = experiencesResponse.data?.find((exp) => {
				const appName = exp.app?.name;
				const appId = exp.app?.id;
				const matches = appName === 'Courses';
				console.log(`[admin/knowledge/courses] Checking experience ${exp.id}: appName = "${appName}", appId = ${appId}, matches "Courses"? ${matches}`);
				return matches;
			});
			
			if (coursesExperience) {
				coursesExperienceId = coursesExperience.id;
				console.log('[admin/knowledge/courses] ✅ Found Courses experience:', {
					experienceId: coursesExperienceId,
					experienceName: coursesExperience.name,
					appId: coursesExperience.app?.id,
					appName: coursesExperience.app?.name,
				});
			} else {
				console.warn('[admin/knowledge/courses] ❌ No Courses experience (app_courses) found for company');
				const availableAppIds = experiencesResponse.data?.map(exp => ({
					experienceId: exp.id,
					experienceName: exp.name,
					appId: exp.app?.id,
					appName: exp.app?.name,
				})).filter(exp => exp.appId);
				console.warn('[admin/knowledge/courses] Available experiences with apps:', JSON.stringify(availableAppIds, null, 2));
			}
		} catch (error) {
			console.error('[admin/knowledge/courses] Error fetching experiences:', error);
			if (error instanceof Error) {
				console.error('[admin/knowledge/courses] Error message:', error.message);
				console.error('[admin/knowledge/courses] Error stack:', error.stack);
			}
		}

		// Fetch courses from Whop API using user-specific SDK
		const coursesResponse = await tokenData.whop.courses.list({
			company_id: companyId,
		});

		if (!coursesResponse || !coursesResponse.data) {
			console.error('[admin/knowledge/courses] No courses found or error fetching from Whop');
			return Response.json(
				{ courses: [], error: 'Failed to fetch courses from Whop' },
				{ status: 200 }, // Return empty array instead of error
			);
		}

		const courses = coursesResponse.data;
		console.log(`[admin/knowledge/courses] Found ${courses.length} courses`);

		// Fetch detailed course data with chapters and lessons
		// Note: The nested lessons in course.chapters[].lessons don't include full lesson details like thumbnails
		// We'll use the course thumbnail as a fallback for lessons
		const coursesWithDetails = await Promise.all(
			courses.map(async (course) => {
				try {
					const courseDetail = await tokenData.whop.courses.retrieve(course.id);
					return courseDetail;
				} catch (error) {
					console.error(`[admin/knowledge/courses] Error fetching details for course ${course.id}:`, error);
					return null;
				}
			})
		);

		const validCourses = coursesWithDetails.filter((c): c is NonNullable<typeof c> => c !== null);

		// Fetch training status from Supabase
		const supabase = createSupabaseClient();
		const { data: trainingStatuses, error: trainingError } = await supabase
			.from('courses')
			.select('*')
			.eq('whop_company_id', companyId);

		if (trainingError) {
			console.error('[admin/knowledge/courses] Error fetching training statuses:', trainingError);
			// Continue with empty training statuses
		}

		// Use saved company_slug and experience_id from database if available (as fallback)
		const savedStatus = trainingStatuses && trainingStatuses.length > 0 ? trainingStatuses[0] : null;
		if (savedStatus?.company_slug && !companySlug) {
			companySlug = savedStatus.company_slug;
			console.log('[admin/knowledge/courses] Using saved company slug from database');
		}
		if (savedStatus?.experience_id && !coursesExperienceId) {
			coursesExperienceId = savedStatus.experience_id;
			console.log('[admin/knowledge/courses] Using saved experience ID from database');
		}

		const trainingMap = new Map<string, CourseTrainingStatus>();
		(trainingStatuses || []).forEach((status: any) => {
			trainingMap.set(status.lesson_id, status as CourseTrainingStatus);
		});

		// Collect all lesson IDs from Whop API
		const whopLessonIds = new Set<string>();
		validCourses.forEach((course) => {
			course.chapters.forEach((chapter) => {
				chapter.lessons.forEach((lesson) => {
					whopLessonIds.add(lesson.id);
				});
			});
		});

		// Find orphaned lessons (in Supabase but not in Whop API)
		// Include all trained lessons not in Whop (both kept and not kept)
		const orphanedLessons: CourseTrainingStatus[] = (trainingStatuses || [])
			.filter((status: any) => {
				const isTrained = status.status === 'trained';
				const notInWhop = !whopLessonIds.has(status.lesson_id);
				return isTrained && notInWhop;
			})
			.map((status: any) => status as CourseTrainingStatus);

		// Merge courses with training status
		const coursesWithTrainingStatus: CourseWithTrainingStatus[] = validCourses.map((course) => {
			// Calculate stats for each chapter and lesson
			const chaptersWithStats = course.chapters.map((chapter) => {
				const lessonsWithStatus = chapter.lessons.map((lesson) => {
					const trainingStatus = trainingMap.get(lesson.id);
					// Ensure we preserve the full lesson object structure including thumbnail
					return {
						...lesson,
						trainingStatus,
						// Preserve thumbnail data - it might be in different formats
						thumbnail: (lesson as any).thumbnail || null,
					};
				});

				// Calculate chapter stats - only count multi-media lessons
				const multiMediaLessons = lessonsWithStatus.filter((l) => l.lesson_type === 'multi');
				const chapterStats = {
					total: multiMediaLessons.length,
					trained: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'trained').length,
					pending: multiMediaLessons.filter((l) => !l.trainingStatus || l.trainingStatus.status === 'pending').length,
					transcribing: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribing').length,
					transcribe_failed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribe_failed').length,
					transcribed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribed').length,
					training: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'training').length,
					train_failed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'train_failed').length,
				};

				return {
					...chapter,
					lessons: lessonsWithStatus,
					trainingStats: chapterStats,
				};
			});

			// Calculate course-level stats - only count multi-media lessons
			const allLessons = chaptersWithStats.flatMap((ch) => ch.lessons);
			const multiMediaLessons = allLessons.filter((l) => l.lesson_type === 'multi');
			const courseStats = {
				total: multiMediaLessons.length,
				trained: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'trained').length,
				pending: multiMediaLessons.filter((l) => !l.trainingStatus || l.trainingStatus.status === 'pending').length,
				transcribing: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribing').length,
				transcribe_failed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribe_failed').length,
				transcribed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'transcribed').length,
				training: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'training').length,
				train_failed: multiMediaLessons.filter((l) => l.trainingStatus?.status === 'train_failed').length,
			};

			return {
				id: course.id,
				title: course.title || '',
				description: course.description || null,
				thumbnail: course.thumbnail && course.thumbnail.optimized_url
					? { optimized_url: course.thumbnail.optimized_url }
					: null,
				chapters: chaptersWithStats,
				trainingStats: courseStats,
			};
		});

		console.log('[admin/knowledge/courses] Returning courses with training status', {
			coursesCount: coursesWithTrainingStatus.length,
			orphanedLessonsCount: orphanedLessons.length,
		});
		return Response.json({ 
			courses: coursesWithTrainingStatus,
			orphanedLessons: orphanedLessons,
			companySlug,
			experienceId: coursesExperienceId,
		});
	} catch (error) {
		console.error('[admin/knowledge/courses] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

