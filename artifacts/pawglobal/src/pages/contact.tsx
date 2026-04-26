import { PageTransition } from "@/components/PageTransition";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone, MessageCircle, Send } from "lucide-react";
import { useStoreSettings } from "@/hooks/use-store-settings";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const { settings } = useStoreSettings();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const buildWhatsAppMessage = (data: ContactFormValues) => [
    "👋 New message from EuthList Contact Form",
    "",
    `📌 Subject: ${data.subject}`,
    `👤 Name: ${data.name}`,
    `📧 Email: ${data.email}`,
    "",
    `💬 Message:`,
    data.message,
  ].join("\n");

  const openWhatsApp = (number: string) => {
    const phone = number.replace(/\D/g, "");
    if (!phone) return null;
    return `https://wa.me/${phone}`;
  };

  const onSubmit = (data: ContactFormValues) => {
    const phone = settings.whatsappNumber?.replace(/\D/g, "");
    if (phone) {
      const text = buildWhatsAppMessage(data);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      toast({
        title: "Opening WhatsApp…",
        description: "Your message is ready to send via WhatsApp.",
      });
    } else {
      toast({
        title: "Message Prepared",
        description: "WhatsApp is not configured yet — please contact us directly.",
      });
    }
    form.reset();
  };

  const waLink = openWhatsApp(settings.whatsappNumber || "");

  return (
    <PageTransition>
      <SEOHead
        title="Contact Us"
        description="Get in touch with EuthList. Ask about pet adoption, orders, donations, or animal rescue. We respond quickly on WhatsApp."
        keywords="contact euthlist, pet rescue contact, adopt pet enquiry, animal rescue help"
      />
      <div className="bg-background min-h-screen py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about adoption, shipping, or our products? We're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact Info */}
            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-serif font-bold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  {settings.address && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Our Address</h4>
                        <p className="text-muted-foreground">{settings.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Email Us</h4>
                      <a
                        href={`mailto:${settings.contactEmail || "hello@euthlist.com"}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {settings.contactEmail || "hello@euthlist.com"}
                      </a>
                    </div>
                  </div>
                  {settings.phone && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Call Us</h4>
                        <p className="text-muted-foreground">{settings.phone}<br />Mon–Fri, 9am – 6pm GMT</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp quick-contact card */}
              <div className="bg-[#25D366]/5 border-2 border-[#25D366]/30 p-8 rounded-3xl text-center">
                <div className="w-14 h-14 bg-[#25D366]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-[#25D366]" />
                </div>
                <h4 className="font-bold text-xl mb-2">Fastest Response</h4>
                <p className="text-muted-foreground mb-6 text-sm">
                  Chat with our support team directly on WhatsApp — we typically reply within minutes.
                </p>
                {waLink ? (
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold gap-2 h-12">
                      <MessageCircle className="w-5 h-5" /> Message on WhatsApp
                    </Button>
                  </a>
                ) : (
                  <Button disabled className="w-full bg-[#25D366]/50 text-white font-bold gap-2 h-12">
                    <MessageCircle className="w-5 h-5" /> WhatsApp not configured
                  </Button>
                )}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-muted/10 p-8 md:p-10 rounded-3xl border border-border/50">
              <h3 className="text-2xl font-serif font-bold mb-2">Send a Message</h3>
              <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                Your message will be sent directly via WhatsApp.
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input className="h-12 bg-background" placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input className="h-12 bg-background" type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input className="h-12 bg-background" placeholder="How can we help?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[140px] bg-background resize-none"
                            placeholder="Type your message here..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-base font-bold gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                  >
                    <Send className="w-5 h-5" /> Send via WhatsApp
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Clicking "Send" opens WhatsApp with your message pre-filled. You'll complete sending from there.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
