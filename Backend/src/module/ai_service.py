import os
from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import HumanMessage

load_dotenv()

model = ChatMistralAI(
    model="mistral-small-latest",
    api_key=os.getenv("MISTRAL_API_KEY")
)

def enhance_text(text, mode="friendly", emotion="happy"):
    try:
        prompt = f"""
You are a text rewriting assistant.

IMPORTANT RULES:
- Return ONLY the rewritten text
- Do NOT add phrases like "Here is", "Here’s", "Rewrite", "Enhanced version"
- Do NOT explain anything
- Do NOT add titles or introductions
- Keep meaning same but improve clarity and tone

Mode: {mode}
Emotion: {emotion}

Text: {text}
"""

        response = model.invoke([
            HumanMessage(content=prompt)
        ])

        return response.content.strip()

    except Exception as e:
        return str(e)