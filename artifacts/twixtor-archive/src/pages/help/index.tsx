import { Navbar } from "@/components/layout/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    id: "video-asli",
    question: "Apakah semua video di sini buatan sendiri?",
    answer:
      "Nggak semua. Sebagian video adalah hasil clip/repost yang diambil dari sumber lain (biasanya ditandai CR di deskripsi video, artinya 'credit' ke pembuat aslinya), dan sebagian lagi memang diedit/dibuat sendiri oleh admin. Kalau video itu hasil CR, nama atau sumber aslinya biasanya dicantumin di deskripsi video.",
  },
  {
    id: "fungsi-ai",
    question: "Apa fungsi AI (Keonho Cortis) di web ini?",
    answer:
      "AI di web ini bantu kamu make web-nya: cari judul drama/video yang kamu maksud, kasih tau durasi & fps sebuah video, siapa yang upload, atau ngasih rekomendasi link kalau judul yang kamu cari nggak ketemu persis. AI ini cuma jawab hal-hal seputar web ini, di luar itu dia nggak akan bantu.",
  },
  {
    id: "cara-request",
    question: "Gimana cara request drama/judul yang belum ada?",
    answer:
      "Buka halaman Request, isi judul yang kamu mau. Kalau mau diproses lebih cepat, klik tombol Support di navbar dan kirim dukungan berapa pun. Kalau nggak, request kamu tetap masuk antrean dan bakal diproses admin secara manual sesuai giliran.",
  },
  {
    id: "cara-download",
    question: "Gimana cara download video?",
    answer:
      "Buka halaman detail video yang kamu mau, lalu tekan tombol Download yang ada di bawah video. File akan otomatis kesimpan ke penyimpanan HP/PC kamu sesuai pengaturan browser.",
  },
  {
    id: "chat-global-dm",
    question: "Bedanya Chat Global sama DM apa?",
    answer:
      "Chat Global itu ruang obrolan terbuka yang bisa dilihat & diisi semua pengguna sekaligus. DM (pesan langsung) itu obrolan privat cuma antara kamu dan satu user lain, nggak kelihatan sama pengguna lain.",
  },
];

export default function Help() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 space-y-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-white/60" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold text-white">
              Pusat Bantuan
            </h1>
            <p className="text-sm text-white/40 max-w-md">
              Jawaban singkat soal video, request, download, chat, dan AI di web ini.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-white/10"
              >
                <AccordionTrigger className="text-white/90 hover:no-underline hover:text-white text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
