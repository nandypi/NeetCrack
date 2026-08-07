import { useLoaderData } from 'react-router'
import { fetchCategories } from '@renderer/lib/content-client'
import CourseCard from '@renderer/components/CourseCard'
import type { Category } from '@shared/domain'

export async function homeLoader(): Promise<Category[]> {
  return fetchCategories()
}

function Home(): React.JSX.Element {
  const categories = useLoaderData() as Category[]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {categories.map((category) => (
        <section key={category.title} className="mb-12 last:mb-0">
          <h2 className="text-xl font-semibold">{category.title}</h2>
          <p className="mt-1 text-sm text-neutral-400">{category.description}</p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default Home
