"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"
import { useTheme } from "@/hooks/use-theme"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  clock_format: z.enum(["12h", "24h"]),
  temperature_unit: z.enum(["celsius", "fahrenheit"]),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

function normalizeTheme(value: string | undefined): AppearanceFormValues["theme"] {
  if (value === "light" || value === "dark" || value === "system") {
    return value
  }
  return "system"
}

function normalizeClock(value: string | undefined): AppearanceFormValues["clock_format"] {
  if (value === "24h" || value === "24") {
    return "24h"
  }
  return "12h"
}

function normalizeTemperature(
  value: string | undefined
): AppearanceFormValues["temperature_unit"] {
  if (value === "fahrenheit") {
    return "fahrenheit"
  }
  return "celsius"
}

export default function AppearanceSettings() {
  const { settings, loading, update } = useDashboardSettings()
  const { setTheme } = useTheme()

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "system",
      clock_format: "12h",
      temperature_unit: "celsius",
    },
  })

  useEffect(() => {
    if (!settings) {
      return
    }

    const values = {
      theme: normalizeTheme(settings.theme),
      clock_format: normalizeClock(settings.clock_format),
      temperature_unit: normalizeTemperature(settings.temperature_unit),
    }

    form.reset(values)
    setTheme(values.theme)
  }, [form, setTheme, settings])

  async function onSubmit(data: AppearanceFormValues) {
    try {
      await update(data)
      setTheme(data.theme)
      toast.success("Preferences saved")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save preferences"
      )
    }
  }

  return (
    <BaseLayout>
      <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold">Appearance</h1>
          <p className="text-muted-foreground">
            Theme, clock, and temperature for your morning dashboard.
          </p>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-8">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Theme</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col gap-6"
                      >
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="light" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Light
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="dark" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Dark
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="system" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            System
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clock_format"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Clock</FormLabel>
                    <FormDescription>Used on the morning dashboard.</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col gap-6"
                      >
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="12h" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            12-hour
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="24h" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            24-hour
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature_unit"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col gap-6"
                      >
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="celsius" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Celsius
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <RadioGroupItem value="fahrenheit" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Fahrenheit
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="cursor-pointer">
                Save preferences
              </Button>
            </form>
          </Form>
        )}
      </div>
    </BaseLayout>
  )
}
