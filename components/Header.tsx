
import Link from 'next/link'
import Image from 'next/image'
import NavItems from './NavItems'
import UserDropdown from './UserDropdown'
import { searchStocks } from '@/lib/actions/finnhub.actions'

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks(""); // Fetch initial stocks to pass to SearchCommand; adjust as needed for your use case
  return (
    <header className="sticky top-0  bg-gray-700">
        <div className="container header-wrapper">
            <Link href='/'>
                <Image src="/assets/icons/logo.png" alt="Logo" width={140} height={32} className='h-8 w-auto cursor-pointer'/>
            </Link>
            <nav className='hidden sm:block'>
                {/* NavItems Component */}
                <NavItems initialStocks={initialStocks}/>
            </nav>
            {/* UserDropdown */}
            <UserDropdown user={user}/>
        </div>
    </header >
  )
}

export default Header