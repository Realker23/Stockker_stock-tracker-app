"use client"

import FooterLink from "@/components/forms/FooterLink"
import InputField from "@/components/forms/InputField"
import { Button } from "@/components/ui/button"
import { signInWithEmail } from "@/lib/actions/auth.actions"
import Link from "next/link"
import { redirect, useRouter } from "next/navigation"

import { Form, SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"


const SignIn = () => {
  const router = useRouter();
  const {register, handleSubmit,control, formState: { errors, isSubmitting }} = useForm<SignInFormData>({defaultValues: {
      email: "",
      password: "",
    },mode: "onBlur"
  }

  );
  


  const onSubmit = async (data:SignInFormData) => {
    try {
      const response = await signInWithEmail(data);
      if(response.success){
        toast.success(response.message);
        router.push("/");// Redirect to homepage or dashboard after successful sign-in
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <>
      <h1 className="form-title">Log In Your Account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* INPUTS */}
        <InputField
          name="email"
          label="Email"
          placeholder="Enter your email"
          register={register}
          error={errors.email}
           validation={{
            required: "Email is required",
            minLength: {
              value: 2,
              message: "Email must be at least 2 characters"
            },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address"
            },
          }}
        />
        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 6 }}
        />
      
        <Button type="submit" className="yellow-btn w-full mt-5" disabled={isSubmitting}>
          {isSubmitting ? "Logging In..." : "Log In"}
        </Button>

        <FooterLink text="Don't have an account?" linkText="Sign Up" href="/sign-up" />
      </form>
    </>
  )
}

export default SignIn