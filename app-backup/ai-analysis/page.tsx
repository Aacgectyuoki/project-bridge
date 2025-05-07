"use client"

import { useEffect, useState } from "react"
import { AIProjectRecommendations } from "@/src/components/ai-project-recommendations"
import { DetailedSkillExtractionLog } from "@/src/components/detailed-skill-extraction-log"
import { ProjectRecommendationsLogViewer } from "@/src/components/project-recommendations-log-viewer"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"

export default function AIAnalysisPage() {
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(null)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch or retrieve the analyses from your state management or localStorage
    const loadAnalyses = async () => {
      try {
        // Example: Load from localStorage
        const storedResumeAnalysis = localStorage.getItem('resumeAnalysis')
        const storedJobAnalysis = localStorage.getItem('jobAnalysis')
        
        if (storedResumeAnalysis && storedJobAnalysis) {
          setResumeAnalysis(JSON.parse(storedResumeAnalysis))
          setJobAnalysis(JSON.parse(storedJobAnalysis))
        } else {
          // Alternatively, you could redirect to a page where users can upload these documents
          console.log("No analyses found in storage")
        }
      } catch (error) {
        console.error("Error loading analyses:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalyses()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI Analysis</h1>

      {loading ? (
        <p>Loading analyses...</p>
      ) : resumeAnalysis && jobAnalysis ? (
        <AIProjectRecommendations 
          resumeAnalysis={resumeAnalysis} 
          jobAnalysis={jobAnalysis}
        />
      ) : (
        <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
          <p>No resume or job analyses found. Please upload and analyze your documents first.</p>
        </div>
      )}

      {/* These components will be visible via their toggle buttons */}
      <DetailedSkillExtractionLog />
      <ProjectRecommendationsLogViewer />
    </div>
  )
}

// import { AIProjectRecommendations } from "@/src/components/ai-project-recommendations"
// import { DetailedSkillExtractionLog } from "@/src/components/detailed-skill-extraction-log"
// import { ProjectRecommendationsLogViewer } from "@/src/components/project-recommendations-log-viewer"

// export default function AIAnalysisPage() {
//   return (
//     <div className="container mx-auto py-8">
//       <h1 className="text-3xl font-bold mb-6">AI Analysis</h1>

//       <AIProjectRecommendations />

//       {/* These components will be visible via their toggle buttons */}
//       <DetailedSkillExtractionLog />
//       <ProjectRecommendationsLogViewer />
//     </div>
//   )
// }
