import argparse
from menu_review import MenuReviewer

def main():
    parser = argparse.ArgumentParser(description="Restaurant Menu Reviewer")
    parser.add_argument("--api_key", type=str, help="Google Gemini API key", default='AIzaSyCCTK90t4X7SVmmFHHbwRtI8u5sk_b7DZE')
    parser.add_argument("--image_path", type=str, help="Path to the menu image", default = './menus/menu3.jpg')
    parser.add_argument("--language", type=str, choices=["English", "Korean", "Chinese", "French"], help="Language for the review")
    parser.add_argument("--task", type=str, choices=['simple_menu', 'summarize', 'recommendation'], default = 'summarize')
    parser.add_argument('--dietary_restrictions', type=str, help='Dietary restrictions for the user', default= None)
    parser.add_argument('--allergies', type=str, help='Allergies for the user', default = None)
    parser.add_argument('--culture', type=str, help='Cultural preferences for the user', default= None)
    args = parser.parse_args()
    
    reviewer = MenuReviewer(args.api_key, args.task, args.language, args.dietary_restrictions, args.allergies, args.culture)
    review = reviewer.generate_review(args.image_path)
    print(review)

if __name__ == "__main__":
    main()
