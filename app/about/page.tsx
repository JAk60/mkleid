import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">About genzquicks</h1>

          <div className="space-y-8 text-lg text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
              <p>
                genzquicks was born from a simple idea: create fashion that speaks to Gen Z. We believe that style
                should be bold, authentic, and accessible to everyone. Our mission is to provide trendy, high-quality
                clothing that lets you express yourself.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Values</h2>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>
                    <strong>Quality:</strong> We use premium materials and ethical manufacturing practices.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>
                    <strong>Sustainability:</strong> We're committed to reducing our environmental impact.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>
                    <strong>Inclusivity:</strong> Fashion is for everyone. We offer a wide range of sizes and styles.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>
                    <strong>Innovation:</strong> We stay ahead of trends and constantly evolve our collections.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Why Choose Us?</h2>
              <p>
                At genzquicks, we're not just selling clothes—we're building a community. Every piece is carefully
                curated to ensure you get the best quality and style. Our customer service team is always ready to help,
                and we offer hassle-free returns.
              </p>
            </section>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">Ready to join the genzquicks family?</h3>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
