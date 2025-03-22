import google.generativeai as genai
import PIL.Image  
from flask import Flask, request, jsonify

app = Flask(__name__)

class MenuReviewer:
    def __init__(self, api_key, task, language, dietary_restrictions, allergies, culture):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.chat = self.model.start_chat(history=[])
        self.task = task
        self.languages = language
        self.dietary_restrictions = dietary_restrictions
        self.allergies = allergies
        self.culture = culture
    
    def load_image(self, image_path):
        """Loads an image from the given path."""
        return PIL.Image.open(image_path)
    
    def generate_review(self, image_path):
        """Generates a restaurant menu review based on the provided image and selected language."""

        image = self.load_image(image_path)
        
        prompt = return_prompt(self.task, self.languages, self.dietary_restrictions, self.allergies, self.culture)
        response = self.chat.send_message([prompt, image])
        print(response.text)  # Print the generated review
        return response.text


def return_prompt(task, language, dietary, allergies, culture):
    if task == 'summarize':
        prompt = f"""
        You are a helpful restaurant reviewer. Summarize this restaurant's menu with the goal of helping a user decide whether to eat here or not. 
        Generate your review in {language} The user uses {language}.

        Please provide:

        1.  A very brief overview of the types of dishes offered.
        2.  Key considerations regarding the menu, such as variety, specific culinary styles, and any unique or signature items.
        3.  An assessment of the general price range (e.g., budget-friendly, mid-range, expensive).
        4.  Information about any dietary accommodations (e.g., vegetarian, vegan, gluten-free) considering the menu.
        5.  A brief description of the type of dining experience the menu suggests (e.g., casual, fine dining, family-friendly).
        6.  A short conclusion stating what type of person or group would likely enjoy dining at this establishment.
        """

    if task == 'simple_menu':
        prompt = f"""
        '1.translate the dishes in the picture to ' + {language} .
        2.if the dish does not contain ingredients, just translate the name of the dish to phrase that is easy to understand.'
        3.if the ingredients are too complex, use simplier terms.'
        """

    if task == 'recommendation':

        prompt = f"""
        You are a personalized restaurant menu assistant. Please provide a dish recommendation, prioritizing the user's specific needs and preferences.
        Generate your review in {language} The user uses {language}.
        User Profile:

        Allergies: {allergies if allergies else 'None'}
        Dietary Restrictions: {dietary if dietary else 'None'}
        Cultural Food Preferences: {culture if culture else 'No specific preference'}

        Task:

        1.  Analyze the user's allergies and dietary restrictions to ensure the recommended dish is safe for consumption.
        2.  Consider the user's cultural food preferences to provide a dish they are likely to enjoy.
        3.  Select the most suitable dish from the menu that aligns with all of the user's criteria.
        4.  Provide a brief, positive review of the recommended dish in {language}, highlighting why it's a good choice for the user.
        5.  If no dishes match the user's criteria, clearly state that and offer alternative suggestions or cuisines that might be suitable.

        Please ensure the recommendation is clear, concise, and helpful.
        """

    return prompt

@app.route('/generate_review', methods=['POST'])
def generate_review_endpoint():
    data = request.get_json()
    image_path = data['image_path']
    reviewer = MenuReviewer(api_key='your_api_key', task='summarize', language='English', dietary_restrictions=None, allergies=None, culture=None)
    review = reviewer.generate_review(image_path)
    return jsonify({'summary': review})

if __name__ == '__main__':
    app.run(debug=True)
