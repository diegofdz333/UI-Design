from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def homepage():
    return render_template("index.html")

@app.route("/quiz")
def quiz():
    return render_template("quiz.html")

@app.route("/game")
def game():
    return render_template("game.html")

@app.route("/quiz_result")
def quiz_result():
    score = request.args.get("score", default=0, type=int)
    return render_template("quiz_result.html", score=score)

if __name__ == "__main__":
    app.run(debug=True)
