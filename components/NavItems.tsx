"use client"

import { NAV_ITEMS} from '@/lib/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SearchCommand from './SearchCommand'


const NavItems = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {

    const pathName = usePathname();

    
    const isActive = (path: string) => {
        // console.log("Current Pathname:", pathName, path);
        if (path === '/') {
            return pathName === '/';
        }
        return pathName.startsWith(path);
    }

  return (
    <ul className='flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium'>
        {NAV_ITEMS.map(({href,label}) => {
            if(label==="Search") return (
                <li key="search-trigger">
                    <SearchCommand 
                        renderAs='text'
                        label="Search"
                        initialStocks={initialStocks} // You can pass an empty array or actual stock data if available
                    />
                </li>
            )
            return (
                <li key={href}>
                    <Link href={href} className={`hover:text-yellow-500 transition-colors ${isActive(href) ? ' text-gray-100' : ''}`}>{label}</Link>
                </li>
            );
        })}
    </ul>
  )
}

export default NavItems