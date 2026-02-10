import React from 'react'
import './../globals.css'
import Header from '@/components/Header'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const Layout = async ({children}: { children: React.ReactNode }) => {

  const session = await auth.api.getSession({headers: await headers()})
    
  if(!session){
    redirect("/sign-in");   //// Server-side redirect
  }

  const user = {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "",
    id: session?.user?.id || "",
  }

  return (
    <main className='min-h-screen text-gray-400'>
        {/* Header */}
        <Header user={user}/>
        
        <div className='container mx-auto py-10'>
            {children}
        </div>
    </main>
  )
}

export default Layout