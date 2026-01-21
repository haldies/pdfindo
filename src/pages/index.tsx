import { motion } from 'framer-motion';
import { Layers, Scissors, FileStack, Hash, Droplets, Image, ImagePlus, Minimize2, PenTool, Shield, Zap, Globe } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToolCard from '@/components/shared/ToolCard';

const tools = [
  {
    title: 'Gabungkan PDF',
    description: 'Satukan beberapa file PDF menjadi satu dokumen.',
    icon: Layers,
    href: '/merge'
  },
  {
    title: 'Pisahkan PDF',
    description: 'Pisahkan halaman PDF menjadi beberapa file.',
    icon: Scissors,
    href: '/split'
  },
  {
    title: 'Atur PDF',
    description: 'Susun ulang, putar, atau hapus halaman PDF.',
    icon: FileStack,
    href: '/organize'
  },
  {
    title: 'Nomor Halaman',
    description: 'Tambahkan nomor halaman dengan posisi kustom.',
    icon: Hash,
    href: '/page-numbers'
  },
  {
    title: 'Watermark',
    description: 'Tambahkan watermark teks atau gambar ke PDF.',
    icon: Droplets,
    href: '/watermark'
  },
  {
    title: 'PDF ke JPG',
    description: 'Konversi halaman PDF ke gambar berkualitas tinggi.',
    icon: Image,
    href: '/pdf-to-jpg'
  },
  {
    title: 'JPG ke PDF',
    description: 'Buat PDF dari beberapa gambar sekaligus.',
    icon: ImagePlus,
    href: '/jpg-to-pdf'
  },
  {
    title: 'Kompres PDF',
    description: 'Kurangi ukuran file PDF dengan kualitas terjaga.',
    icon: Minimize2,
    href: '/compress'
  },
  {
    title: 'Tanda Tangan PDF',
    description: 'Tambahkan tanda tangan ke dokumen PDF.',
    icon: PenTool,
    href: '/sign'
  }
];

const features = [
  {
    icon: Shield,
    title: '100% Aman',
    description: 'Semua proses di browser Anda. File tidak pernah meninggalkan perangkat.'
  },
  {
    icon: Zap,
    title: 'Super Cepat',
    description: 'Tanpa waktu upload. Proses file instan dengan teknologi client-side.'
  },
  {
    icon: Globe,
    title: 'Offline Mode',
    description: 'Setelah dimuat, PDFIndo bisa bekerja tanpa koneksi internet.'
  }
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section - Langsung ke Tools */}
      <section className="pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Semua Tools <span className="text-primary">PDF</span> Gratis
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Proses PDF langsung di browser. Aman, cepat, tanpa upload ke server.
            </p>
          </motion.div>

          {/* Tools Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 auto-rows-fr">
            {tools.map((tool, index) => (
              <ToolCard key={tool.title} {...tool} delay={0.05 + index * 0.03} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-surface-subtle">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Kenapa PDFIndo?
            </h2>
            <p className="text-muted-foreground">
              Dibuat dengan prioritas privasi dan kecepatan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
