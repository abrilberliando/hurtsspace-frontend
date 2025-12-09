import LookBookCard from '@/components/shared/LookBookCard'
import React from 'react'

const page = () => {
  return (
    <>
    <div>
      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter my-5 text-center">
          The Lookbook
        </h1>
    </div>
    <div>
      <LookBookCard />
    </div>
    </>
  )
}

export default page