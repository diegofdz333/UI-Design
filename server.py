from flask import Flask, render_template, request, Response, jsonify

app = Flask(__name__)

quiz_high_score = 0
game_scores = []
game_high_score = 0

def store_game_data(json):
    global game_scores, game_high_score

    score = json["score"]

    game_scores.append(score)
    game_high_score = max(game_high_score, score)

    print(score, game_high_score)

    response = {"score": game_high_score}

    return response

@app.route("/")
def homepage():
    return render_template("index.html")

@app.route("/quiz")
def quiz():
    return render_template("quiz.html")

@app.route("/game")
def game():
    global game_high_score

    return render_template("game.html")

@app.route('/store_score', methods=["POST"])
def route_store_game_score():
    if request.method == "POST":
        json = request.get_json()
        response_data = store_game_data(json)
        response = {"message": "Data received successfully", "data": response_data}
        return jsonify(response) # Send a JSON response

@app.route("/quiz_result")
def quiz_result():
    global quiz_high_score
    score = request.args.get("score", default=0, type=int)
    quiz_high_score = max(score, quiz_high_score)
    print(quiz_high_score)

    return render_template("quiz_result.html", score=score, high_score=quiz_high_score)

if __name__ == "__main__":
    app.run(debug=True)
