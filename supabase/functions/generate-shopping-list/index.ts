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
    // I'm now correctly expecting both the meal plan and the budget mode flag.
    const { mealPlan, budgetMode } = await req.json();

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set.');
    }
    
    if (!mealPlan) {
        throw new Error("A meal plan is required to generate a shopping list.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // My prompt now includes logic to handle the budget-friendly mode.
    const prompt = `
      Based on the following 7-day meal plan, generate a shopping list categorized by smart store aisles (e.g., Produce, Meat & Seafood, Dairy & Eggs, Pantry, Spices & Oils, Bakery).
      ${budgetMode ? "The user is in 'budget-friendly' mode, so please suggest cheaper alternatives for ingredients where appropriate (e.g., 'chicken breast (or cheaper chicken thighs)')." : ""}
      The user's meal plan is:
      ${JSON.stringify(mealPlan, null, 2)}
      Output the shopping list as a single, valid JSON object. Do not include any text, notes, or markdown formatting before or after the JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // I've made the JSON parsing more robust here as well.
    const jsonResponseText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const shoppingList = JSON.parse(jsonResponseText);

    return new Response(JSON.stringify({ shoppingList }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in generate-shopping-list function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})