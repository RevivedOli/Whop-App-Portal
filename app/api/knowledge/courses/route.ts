import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'
import type { CourseWithTrainingStatus } from '@/lib/types'

/**
 * GET /api/knowledge/courses
 * 
 * Returns all courses for the company with their chapters and lessons.
 * Fetches courses from Whop API (Whop Courses app) and shapes them for the UI.
 */
export async function GET(request: Request): Promise<Response> {
	console.log('[api/knowledge/courses] Request received')

	try {
		const requestHeaders = await headers()
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses] Authentication failed')
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		// Get query parameters
		const { searchParams } = new URL(request.url)
		const companyIdFromParams = searchParams.get('companyId')
		const companyId = companyIdFromParams || tokenData.companyId

		if (!companyId) {
			return Response.json(
				{ error: 'Company ID is required' },
				{ status: 400 },
			)
		}

		console.log('[api/knowledge/courses] Fetching courses for company:', companyId)

		// Fetch courses from Whop API using the MCP-documented pattern:
		// 1) list_courses for the company
		// 2) retrieve_courses for each course to get chapters + lessons

		if (!tokenData.whop.courses || typeof tokenData.whop.courses.list !== 'function') {
			console.error('[api/knowledge/courses] courses.list is not available on Whop SDK instance')
			console.error('[api/knowledge/courses] Available whop methods:', Object.keys(tokenData.whop))
			return Response.json(
				{ error: 'Courses API not available in Whop SDK', courses: [], orphanedLessons: [], companySlug: null, experienceId: null },
				{ status: 500 },
			)
		}

		const listResponse = await tokenData.whop.courses.list({
			company_id: companyId,
		})

		const basicCourses = Array.isArray(listResponse?.data) ? listResponse.data : []

		console.log('[api/knowledge/courses] Found basic courses:', basicCourses.length)

		// Retrieve full course details (with chapters + lessons)
		const detailedCourses = await Promise.all(
			basicCourses.map(async (course: any) => {
				try {
					if (!tokenData.whop.courses.retrieve || typeof tokenData.whop.courses.retrieve !== 'function') {
						return course
					}
					return await tokenData.whop.courses.retrieve(course.id)
				} catch (error) {
					console.error('[api/knowledge/courses] Error retrieving course', course.id, error)
					return course
				}
			}),
		)

		const coursesWithTrainingStatus: CourseWithTrainingStatus[] = detailedCourses.map((course: any) => {
			const chapters = Array.isArray(course.chapters) ? course.chapters : []

			const mappedChapters = chapters.map((chapter: any) => {
				const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : []

				return {
					...chapter,
					lessons: lessons.map((lesson: any) => ({
						...lesson,
						trainingStatus: null,
						thumbnail: (lesson as any).thumbnail || null,
					})),
					trainingStats: {
						total: lessons.length,
						trained: 0,
						pending: lessons.length,
						transcribing: 0,
						transcribe_failed: 0,
						transcribed: 0,
						training: 0,
						train_failed: 0,
					},
				}
			})

			return {
				id: course.id,
				title: course.title || '',
				description: course.description || null,
				thumbnail: course.thumbnail && course.thumbnail.optimized_url
					? { optimized_url: course.thumbnail.optimized_url }
					: null,
				chapters: mappedChapters,
				trainingStats: {
					total: mappedChapters.reduce((sum, ch) => sum + ch.trainingStats.total, 0),
					trained: 0,
					pending: mappedChapters.reduce((sum, ch) => sum + ch.trainingStats.total, 0),
					transcribing: 0,
					transcribe_failed: 0,
					transcribed: 0,
					training: 0,
					train_failed: 0,
				},
			}
		})

		console.log('[api/knowledge/courses] Returning courses with chapters + lessons (no training status yet)', {
			coursesCount: coursesWithTrainingStatus.length,
		})

		return Response.json({
			courses: coursesWithTrainingStatus,
			orphanedLessons: [],
			companySlug: null,
			experienceId: null,
		})
	} catch (error) {
		console.error('[api/knowledge/courses] Error:', error)
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		)
	}
}

