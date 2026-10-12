from sqlalchemy.ext.asyncio import AsyncSession

from app.external.openrouter_client import OpenRouterClient
from app.models.user import CodeReview, User
from app.repositories.profile_repository import CodeReviewRepository
from app.schemas.code_review import CodeReviewAnalysis, CodeReviewRequest, CodeReviewResponse


class CodeReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.reviews = CodeReviewRepository(db)
        self.ai = OpenRouterClient()

    async def review(self, user: User, data: CodeReviewRequest) -> CodeReviewResponse:
        analysis_raw = await self.ai.review_code(data.source_code, data.language, data.problem_title)
        analysis = CodeReviewAnalysis(
            time_complexity=analysis_raw.get("time_complexity", "Unknown"),
            space_complexity=analysis_raw.get("space_complexity", "Unknown"),
            bugs=analysis_raw.get("bugs", []),
            edge_cases=analysis_raw.get("edge_cases", []),
            better_approaches=analysis_raw.get("better_approaches", []),
            optimized_solution=analysis_raw.get("optimized_solution", ""),
            overall_score=int(analysis_raw.get("overall_score", 70)),
            summary=analysis_raw.get("summary", "Review complete"),
        )

        review = CodeReview(
            user_id=user.id,
            problem_title=data.problem_title,
            language=data.language,
            source_code=data.source_code,
            analysis=analysis.model_dump(),
        )
        review = await self.reviews.create(review)
        return CodeReviewResponse(
            id=review.id,
            problem_title=review.problem_title,
            language=review.language,
            analysis=analysis,
            created_at=review.created_at,
        )

    async def list_reviews(self, user: User) -> list[CodeReviewResponse]:
        reviews = await self.reviews.list_for_user(user.id)
        result = []
        for r in reviews:
            analysis = CodeReviewAnalysis(**r.analysis)
            result.append(
                CodeReviewResponse(
                    id=r.id,
                    problem_title=r.problem_title,
                    language=r.language,
                    analysis=analysis,
                    created_at=r.created_at,
                )
            )
        return result
