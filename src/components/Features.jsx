import { Truck, ShieldCheck, Headphones } from 'lucide-react'

const FEATURES = [
  {
    Icon: Truck,
    title: 'TEZKOR VA BEPUL YETKAZISH',
    text: "Toshkent shahri ichida yetkazib berish va o'rnatish mutlaqo bepul",
  },
  {
    Icon: ShieldCheck,
    title: 'RASMIY KAFOLAT',
    text: 'Barcha yumshoq mebellarga 3 yilgacha zavod kafolati beriladi',
  },
  {
    Icon: Headphones,
    title: "24/7 MIJOZLARGA KO'MAK",
    text: 'Sizga mebel tanlashda yordam beradigan professional maslahatchilar',
  },
]

function Features() {
  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto max-w-[1360px] px-3">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {FEATURES.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center"
            >
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[10px] border-[#b0b0b0]/50 bg-[#0b3c3c] shadow-sm"
                aria-hidden
              >
                <Icon className="h-9 w-9 text-white" strokeWidth={1.75} />
              </div>
              <h4 className="mt-6 font-[Poppins] text-lg font-semibold uppercase leading-7 tracking-wide text-[#1a1a1a]">
                {title}
              </h4>
              <p className="mt-2 max-w-[280px] font-[Poppins] text-sm leading-relaxed text-[#666]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
