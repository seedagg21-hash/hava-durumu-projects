from flask import Flask, jsonify, render_template, request
import os
import requests
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

API_KEY = os.getenv("WEATHER_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/weather")
def weather():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        lat, lon = "41.01", "28.97"  # İstanbul fallback
    url = f"http://api.weatherapi.com/v1/forecast.json?key={API_KEY}&q={lat},{lon}&days=3&aqi=no&alerts=no&lang=tr"
    r = requests.get(url, timeout=10)
    return jsonify(r.json())

if __name__ == "__main__":
    app.run(debug=True)
