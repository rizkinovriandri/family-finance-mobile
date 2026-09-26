// Satu titik impor untuk semua ikon UI (Tabler Icons) — sama dengan family-finance-app
// (components/icons.tsx). Import dari sini, jangan langsung dari paket Tabler.
//
// Tiap ikon diimpor per file (deep import), BUKAN dari barrel '@tabler/icons-react-native':
// barrel-nya me-load ±6.000 file ikon sekaligus, bikin Metro kena EMFILE dan bundle membengkak.
// Menambah ikon baru: tambahkan satu baris `export { default as IconXxx } from '@tabler/icons-react-native/IconXxx';`

// UI umum & navigasi
export { default as IconAlertCircle } from '@tabler/icons-react-native/IconAlertCircle';
export { default as IconArrowDownCircle } from '@tabler/icons-react-native/IconArrowDownCircle';
export { default as IconArrowUpCircle } from '@tabler/icons-react-native/IconArrowUpCircle';
export { default as IconArrowsExchange } from '@tabler/icons-react-native/IconArrowsExchange';
export { default as IconCalendar } from '@tabler/icons-react-native/IconCalendar';
export { default as IconCamera } from '@tabler/icons-react-native/IconCamera';
export { default as IconInfoCircle } from '@tabler/icons-react-native/IconInfoCircle';
export { default as IconLock } from '@tabler/icons-react-native/IconLock';
export { default as IconMail } from '@tabler/icons-react-native/IconMail';
export { default as IconLogout } from '@tabler/icons-react-native/IconLogout';
export { default as IconPencil } from '@tabler/icons-react-native/IconPencil';
export { default as IconTrash } from '@tabler/icons-react-native/IconTrash';
export { default as IconUser } from '@tabler/icons-react-native/IconUser';
export { default as IconChartBar } from '@tabler/icons-react-native/IconChartBar';
export { default as IconChartLine } from '@tabler/icons-react-native/IconChartLine';
export { default as IconChartPie } from '@tabler/icons-react-native/IconChartPie';
export { default as IconChevronLeft } from '@tabler/icons-react-native/IconChevronLeft';
export { default as IconChevronRight } from '@tabler/icons-react-native/IconChevronRight';
export { default as IconCircleMinus } from '@tabler/icons-react-native/IconCircleMinus';
export { default as IconCopy } from '@tabler/icons-react-native/IconCopy';
export { default as IconDots } from '@tabler/icons-react-native/IconDots';
export { default as IconEye } from '@tabler/icons-react-native/IconEye';
export { default as IconEyeOff } from '@tabler/icons-react-native/IconEyeOff';
export { default as IconHome } from '@tabler/icons-react-native/IconHome';
export { default as IconLayoutGrid } from '@tabler/icons-react-native/IconLayoutGrid';
export { default as IconListDetails } from '@tabler/icons-react-native/IconListDetails';
export { default as IconPlus } from '@tabler/icons-react-native/IconPlus';
export { default as IconWallet } from '@tabler/icons-react-native/IconWallet';

// Ikon kategori transaksi (dipetakan di src/constants/category-icons.ts)
export { default as IconArmchair } from '@tabler/icons-react-native/IconArmchair';
export { default as IconBabyCarriage } from '@tabler/icons-react-native/IconBabyCarriage';
export { default as IconBallFootball } from '@tabler/icons-react-native/IconBallFootball';
export { default as IconBarbell } from '@tabler/icons-react-native/IconBarbell';
export { default as IconBolt } from '@tabler/icons-react-native/IconBolt';
export { default as IconBook } from '@tabler/icons-react-native/IconBook';
export { default as IconBriefcase2 } from '@tabler/icons-react-native/IconBriefcase2';
export { default as IconBuildingBank } from '@tabler/icons-react-native/IconBuildingBank';
export { default as IconBuildingSkyscraper } from '@tabler/icons-react-native/IconBuildingSkyscraper';
export { default as IconCar } from '@tabler/icons-react-native/IconCar';
export { default as IconCash } from '@tabler/icons-react-native/IconCash';
export { default as IconCoffee } from '@tabler/icons-react-native/IconCoffee';
export { default as IconCoin } from '@tabler/icons-react-native/IconCoin';
export { default as IconCreditCard } from '@tabler/icons-react-native/IconCreditCard';
export { default as IconCurrencyBitcoin } from '@tabler/icons-react-native/IconCurrencyBitcoin';
export { default as IconDeviceGamepad2 } from '@tabler/icons-react-native/IconDeviceGamepad2';
export { default as IconDeviceLaptop } from '@tabler/icons-react-native/IconDeviceLaptop';
export { default as IconDeviceTv } from '@tabler/icons-react-native/IconDeviceTv';
export { default as IconDroplet } from '@tabler/icons-react-native/IconDroplet';
export { default as IconFileInvoice } from '@tabler/icons-react-native/IconFileInvoice';
export { default as IconFolder } from '@tabler/icons-react-native/IconFolder';
export { default as IconGasStation } from '@tabler/icons-react-native/IconGasStation';
export { default as IconGift } from '@tabler/icons-react-native/IconGift';
export { default as IconHeartbeat } from '@tabler/icons-react-native/IconHeartbeat';
export { default as IconHeartHandshake } from '@tabler/icons-react-native/IconHeartHandshake';
export { default as IconMovie } from '@tabler/icons-react-native/IconMovie';
export { default as IconMusic } from '@tabler/icons-react-native/IconMusic';
export { default as IconParking } from '@tabler/icons-react-native/IconParking';
export { default as IconPaw } from '@tabler/icons-react-native/IconPaw';
export { default as IconPigMoney } from '@tabler/icons-react-native/IconPigMoney';
export { default as IconPill } from '@tabler/icons-react-native/IconPill';
export { default as IconPlane } from '@tabler/icons-react-native/IconPlane';
export { default as IconReceipt2 } from '@tabler/icons-react-native/IconReceipt2';
export { default as IconReceiptRefund } from '@tabler/icons-react-native/IconReceiptRefund';
export { default as IconRepeat } from '@tabler/icons-react-native/IconRepeat';
export { default as IconShieldCheck } from '@tabler/icons-react-native/IconShieldCheck';
export { default as IconShirt } from '@tabler/icons-react-native/IconShirt';
export { default as IconShoppingBag } from '@tabler/icons-react-native/IconShoppingBag';
export { default as IconStar } from '@tabler/icons-react-native/IconStar';
export { default as IconToolsKitchen2 } from '@tabler/icons-react-native/IconToolsKitchen2';
export { default as IconTrendingUp } from '@tabler/icons-react-native/IconTrendingUp';
export { default as IconWashMachine } from '@tabler/icons-react-native/IconWashMachine';
export { default as IconWifi } from '@tabler/icons-react-native/IconWifi';

// Tipe komponen ikon (dipakai kalau ikon dioper sebagai prop).
export type TablerIcon = typeof import('@tabler/icons-react-native/IconHome').default;
