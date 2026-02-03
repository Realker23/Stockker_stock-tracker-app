'use client'

import { useMemo, useState } from 'react'
import countryList from 'react-select-country-list'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '../ui/label'


const CountrySelectField = ({ name, control, error,label,required }:CountrySelectProps) => {
    const countriesOptions = useMemo(() => countryList().getData(), [])
    const [open, setOpen] = useState(false)
    // console.log(countriesOptions);

    return (

        <div className='space-y-2'>
            <Label htmlFor={name} className='form-label'>
                {label}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => {
                    
                    
                    return (
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                    {field.value
                                        ? countriesOptions.find((country) => country.value === field.value)?.label
                                        : `Select ${label.toLowerCase()}...`}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align='start' className="w-full p-0 bg-gray-800 border-gray-600">
                                <Command className="bg-gray-800 w-full">
                                    <CommandInput 
                                        placeholder={`Search ${label.toLowerCase()}...`} 
                                        className="text-white"
                                    />
                                    <CommandList>
                                        <CommandEmpty className="text-gray-400">No country found.</CommandEmpty>
                                        <CommandGroup>
                                            {countriesOptions.map((country) => (
                                                <CommandItem
                                                    key={country.value}
                                                    value={country.label}
                                                    onSelect={() => {
                                                        field.onChange(country.value)
                                                        setOpen(false)
                                                    }}
                                                    className="text-white hover:bg-gray-700"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === country.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {country.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )
                }}
            />
            {error && <p className="form-error">{error.message}</p>}
        </div>
    
  )
}

export default CountrySelectField