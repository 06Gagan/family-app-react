import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // I'm now correctly expecting both preferences and an optional mood.
    const { preferences, mood } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set.')
    }

    if (!preferences) {
        throw new Error("Preferences are required to generate a meal plan.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    // My prompt is now more detailed, using all the info from the user.
    const prompt = `
      You are an expert family meal planning assistant for an app called FamilySync.
      A user has provided their family's food preferences: "${preferences}".
      The user has also specified the mood for the week: "${mood || 'any'}".
      Your task is to generate a diverse, cuisine-rotated 7-day dinner meal plan.
      For each day, provide "meal_name", a brief "description", and an interesting "chef_tip" or a "Did You Know?" fact related to the meal.
      Output the plan as a single, valid JSON object with lowercase day names as keys (e.g., "monday", "tuesday").
      Do not include any text, notes, or markdown formatting before or after the JSON object.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    // I've made the JSON parsing more robust.
    const jsonResponseText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const mealPlan = JSON.parse(jsonResponseText)

    return new Response(JSON.stringify({ mealPlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in generate-meal-plan function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})