import { PageTransition } from "@/components/PageTransition";
import SEOHead from "@/components/SEOHead";

export default function About() {
  return (
    <PageTransition>
      <SEOHead
        title="About EuthList"
        description="Learn about EuthList — our mission to save pets from euthanasia, how we work, and how you can help rescue animals worldwide."
        keywords="about euthlist, pet rescue mission, animal welfare, rescue charity, euthanasia prevention"
      />
      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-primary/5">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Connecting pets with people, globally.</h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              EuthList was born from a simple belief: every animal deserves a loving home,
              and distance should never be a barrier to finding your perfect companion.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80"
                  alt="Dog rescue"
                  className="rounded-3xl shadow-xl rotate-[-2deg]"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  While we pride ourselves on offering premium purebred pets to discerning families worldwide,
                  our heart beats for rescue. A significant portion of our platform is dedicated to facilitating
                  adoptions for stray and abandoned animals around the world.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We partner directly with overwhelmed shelters across every continent, giving them
                  a global platform to showcase animals in need. When you shop with us, you're helping fund
                  these crucial rescue operations worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Partners */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-3xl font-serif font-bold mb-4">Our Global Partners</h2>
            <p className="text-muted-foreground mb-12">Rescue centres and shelters we proudly support worldwide.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "EuthList General Rescue Fund", region: "Worldwide" },
                { name: "North American Rescue Alliance", region: "North America" },
                { name: "European Animal Welfare Network", region: "Europe" },
                { name: "Asia-Pacific Shelter Coalition", region: "Asia & Pacific" },
                { name: "International Stray Support", region: "Global" },
                { name: "City Rescue Centres", region: "Multiple Countries" },
              ].map(partner => (
                <div key={partner.name} className="bg-background p-8 rounded-2xl border">
                  <h3 className="font-bold text-xl mb-2">{partner.name}</h3>
                  <p className="text-muted-foreground">{partner.region}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
