"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { ArrowRight, Code } from "lucide-react"
import { ResumeUpload } from "@/src/components/resume-upload"
import { JobDescriptionInput } from "@/src/components/job-description-input"
import { RoleFocusSelect } from "@/src/components/role-focus-select"
import { ResumeAnalysisResults } from "@/src/components/resume-analysis-results"
import { JobAnalysisResults } from "@/src/components/job-analysis-results"
import { SkillsSummary } from "@/src/components/skills-summary"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { SkillsLogViewer } from "@/src/components/skills-log-viewer"
// Add the new DetailedSkillExtractionLog component to the imports
import { DetailedSkillExtractionLog } from "@/src/components/detailed-skill-extraction-log"
import { forceNewSession } from "@/utils/analysis-session-manager"
// Import the debug function
import { debugLogAllStoredData } from "@/utils/analysis-session-manager"
import { toast } from "@/src/hooks/use-toast"

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState(1)
  const [activeTab, setActiveTab] = useState("resume")
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(null)
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null)
  const [roleFocus, setRoleFocus] = useState("")
  const [fileSelected, setFileSelected] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [showSkillsSummary, setShowSkillsSummary] = useState(false)
  const [showJobSkillsLog, setShowJobSkillsLog] = useState(false)

  useEffect(() => {
    // Create a new session when the dashboard is loaded directly
    if (window.location.pathname === "/dashboard" && !window.location.search.includes("keepSession")) {
      forceNewSession()
    }
  }, [])

  interface ResumeData {
    type?: string;
    data?: any;
    analysis?: ResumeAnalysisResult;
  }
  
  interface JobData {
    text?: string;
    analysis?: JobAnalysisResult;
  }

  const handleResumeUpload = (data: ResumeData) => {
    setResumeData(data);
    setFileUploaded(true);
    if (data.analysis) {
      setResumeAnalysis(data.analysis);
      setShowSkillsSummary(true);
  
      // Log detected skills to console
      console.log("Resume Analysis Complete:");
      console.log("Technical Skills:", data.analysis.skills?.technical || []);
      console.log("Experience:", data.analysis.experience?.length || 0, "entries");
      console.log("Education:", data.analysis.education?.length || 0, "entries");
    }
    if (data) {
      setActiveStep(2);
      // Don't automatically switch to job tab so user can see skills summary
      // setActiveTab("job")
    }
  }

  const handleFileSelection = (selected: boolean) => {
    setFileSelected(selected);
  }

  const handleJobDescriptionSubmit = (data: JobData) => {
    setJobData(data);
    if (data.analysis) {
      setJobAnalysis(data.analysis);
      setShowJobSkillsLog(true); // Show skills log after job analysis
    }
    setActiveStep(3)
    setActiveTab("focus")
  }

  const handleRoleFocusSubmit = (focus: string) => {
    setRoleFocus(focus);
    // Navigate to analysis page
  }

  const handleResumeTextExtracted = (text: string) => {
    console.log("Resume text extracted:", text.substring(0, 100) + "...");
    // You might want to store this text or perform additional processing
  }
  

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code className="h-6 w-6" />
            <span>ProjectBridge</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                1
              </div>
              <div className={`h-0.5 w-12 ${activeStep >= 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                2
              </div>
              <div className={`h-0.5 w-12 ${activeStep >= 3 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 3 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                3
              </div>
              <div className={`h-0.5 w-12 ${activeStep >= 4 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 4 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                4
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resume" onClick={() => setActiveTab("resume")}>
                Resume
              </TabsTrigger>
              <TabsTrigger value="job" onClick={() => setActiveTab("job")} disabled={activeStep < 2}>
                Job Description
              </TabsTrigger>
              <TabsTrigger value="focus" onClick={() => setActiveTab("focus")} disabled={activeStep < 3}>
                Role Focus
              </TabsTrigger>
            </TabsList>
            <TabsContent value="resume">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Resume</CardTitle>
                  <CardDescription>
                    Upload your resume, paste your resume text, or provide your LinkedIn profile URL to analyze your
                    current skills and experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <ResumeUpload 
                  onUpload={handleResumeUpload} 
                  onFileSelect={handleFileSelection}
                  onResumeTextExtracted={handleResumeTextExtracted} 
                />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" disabled>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (resumeData || fileUploaded) {
                        setActiveStep(2)
                        setActiveTab("job")
                      }
                    }}
                    disabled={!resumeData && !fileUploaded}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {showSkillsSummary && resumeAnalysis && (
                <div className="mt-8">
                  <SkillsSummary analysis={resumeAnalysis} />
                </div>
              )}

              {resumeAnalysis && (
                <div className="mt-8">
                  <ResumeAnalysisResults analysis={resumeAnalysis} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="job">
              <Card>
                <CardHeader>
                  <CardTitle>Add Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description you're interested in to identify skill gaps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JobDescriptionInput onSubmit={handleJobDescriptionSubmit} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(1)
                      setActiveTab("resume")
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (jobData) {
                        setActiveStep(3)
                        setActiveTab("focus")
                      }
                    }}
                    disabled={!jobData}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {jobAnalysis && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowJobSkillsLog(!showJobSkillsLog)}>
                    {showJobSkillsLog ? "Hide Skills Log" : "Show Skills Log"}
                  </Button>
                </div>
              )}

              {showJobSkillsLog && jobAnalysis && (
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Skills Log</CardTitle>
                      <CardDescription>Skills extracted from the job description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillsLogViewer inline={true} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {jobAnalysis && (
                <div className="mt-8">
                  <JobAnalysisResults analysis={jobAnalysis} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="focus">
              <Card>
                <CardHeader>
                  <CardTitle>Select Role Focus (Optional)</CardTitle>
                  <CardDescription>
                    Specify which aspect of the role you want to focus on for more targeted project suggestions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleFocusSelect onSubmit={handleRoleFocusSubmit} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(2)
                      setActiveTab("job")
                    }}
                  >
                    Back
                  </Button>
                  <Link href="/analyze">
                    <Button className="gap-1.5">
                      Analyze
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <SkillsLogViewer />
        <DetailedSkillExtractionLog />
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              debugLogAllStoredData()
              toast({
                title: "Debug Info",
                description: "Session data logged to console",
              })
            }}
          >
            Debug: Log Session Data
          </Button>
        </div>
      </main>
    </div>
  )
}
