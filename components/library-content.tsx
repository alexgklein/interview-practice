"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Search } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Question = {
  id: string
  title: string
  category: string
  difficulty: string | null
  companies: string[] | null
  tags: string[] | null
  description: string | null
  question_number: number | null
}

const CATEGORIES = [
  "All Topics",
  "Leadership",
  "Presence",
  "Teamwork",
  "Influence",
  "Ethical",
  "General",
  "Conflict",
  "Failure",
  "Time Management",
]

export function LibraryContent({ questions }: { questions: Question[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Topics")
  const [selectedCompany, setSelectedCompany] = useState("All Companies")

  // Get unique companies from questions
  const companies = useMemo(() => {
    const companySet = new Set<string>()
    questions.forEach((q) => {
      q.companies?.forEach((c) => companySet.add(c))
    })
    return ["All Companies", ...Array.from(companySet).sort()]
  }, [questions])

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All Topics" || q.category === selectedCategory
        const matchesCompany = selectedCompany === "All Companies" || q.companies?.includes(selectedCompany)
        return matchesSearch && matchesCategory && matchesCompany
      })
      .sort((a, b) => (a.question_number || 999) - (b.question_number || 999))
  }, [questions, searchQuery, selectedCategory, selectedCompany])

  return (
    <div className="min-h-screen bg-background pt-4">
      <div className="container mx-auto px-6">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "secondary" : "ghost"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
              className={`rounded-full text-sm ${
                selectedCategory === category
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] bg-secondary/50">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">{selectedCompany}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {companies.map((company) => (
                <DropdownMenuItem key={company} onClick={() => setSelectedCompany(company)}>
                  {company}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-0 border border-border rounded-lg overflow-hidden">
          {filteredQuestions.map((question) => (
            <Link
              key={question.id}
              href={`/workspace/${question.id}`}
              className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors group"
            >
              {/* Question Number and Title */}
              <div className="flex-1 flex items-center gap-4">
                <span className="text-sm text-muted-foreground font-medium w-8">
                  {question.question_number || "—"}.
                </span>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{question.title}</span>
              </div>

              {/* Difficulty Badge */}
              <div className="w-16">
                {question.difficulty && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium border-0 ${
                      question.difficulty === "Easy"
                        ? "text-green-500"
                        : question.difficulty === "Medium"
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {question.difficulty === "Medium" ? "Med." : question.difficulty}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No questions found. Try adjusting your filters.</div>
        )}
      </div>
    </div>
  )
}
