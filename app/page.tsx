import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/library")

  return (
    <></>
  )
}
