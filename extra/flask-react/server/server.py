import json
import sqlite3
from cuid2 import cuid_wrapper
from flask import Flask, g, request, redirect, url_for
from flask_cors import CORS
from jsonschema import validate, Draft202012Validator, ValidationError
from typing import Callable

cuid_generator: Callable[[], str] = cuid_wrapper()

TITLE_MAX_LENGTH = 100
TAG_MAX_LENGTH = 25
CONTENT_MAX_LENGTH = 10000

post_editor_schema = {
	"type": "object",
	"properties": {
		"title": {
			"type": "string",
			"minLength": 1,
			"maxLength": TITLE_MAX_LENGTH,
		},
		"tags": {
			"type": "array",
			"items": {
				"type": "string",
				"minLength": 1,
				"maxLength": TAG_MAX_LENGTH
			}
		},
		"content": {
			"type": "string",
			"minLength": 1,
			"maxLength": CONTENT_MAX_LENGTH
		}
	},
	"required": ["title", "content"]
}

app = Flask(__name__)
CORS(app)

DATABASE = './db/dev.db'

def get_db():
	db = getattr(g, '_database', None)
	if db is None:
		db = g._database = sqlite3.connect(DATABASE)
		db.row_factory = dict_factory
	return db

@app.teardown_appcontext
def close_connection(exception):
	db = getattr(g, '_database', None)
	if db is not None:
		db.close()

def query_db(query, args=(), one=False):
	cur = get_db().execute(query, args)
	rv = cur.fetchall()
	cur.close()
	return (rv[0] if rv else None) if one else rv

def dict_factory(cursor, row):
	fields = [column[0] for column in cursor.description]
	return {key: value for key, value in zip(fields, row)}

@app.route("/")
def index():
	return redirect(url_for("posts"))

@app.route("/posts", methods=['GET', 'POST'])
def posts():
	if request.method == "POST":
		title = request.form["title"]
		content = request.form["content"]
		intent = request.form["intent"]

		tags = []
		for key, value in request.form.items():
			if key.startswith("tags[") and key.endswith("]"):
				index = int(key[5:-1])
				tags.insert(index, value)

		if intent.startswith("list-insert"):
			tags.append("")
			return {
				"status": "idle",
				"submission": {
					"title": title,
					"tags": tags,
					"intent": intent,
				}
			}

		if intent.startswith("list-remove"):
			index = int(intent.split("/")[1])
			del tags[index]
			return {
				"status": "idle",
				"submission": {
					"title": title,
					"tags": tags,
					"intent": intent,
				}
			}

		if intent == "submit":
			submission = {
				"title": title,
				"tags": tags,
				"content": content
			}

			try:
				validate(
					instance=submission,
					schema=post_editor_schema
				)
				new_post = (
					cuid_generator(),
					title,
					",".join(tags),
					content
				)

				conn = get_db()
				conn.execute(
					"""INSERT INTO Post(id, title, tags, content) VALUES(?,?,?,?) """, new_post
				)
				conn.commit()

				return {
					"status": "success",
				}
			except ValidationError:
				validator = Draft202012Validator(post_editor_schema)
				error_messages = {
					"formErrors": [],
					"fieldErrors": {
						"title": [],
						"tags": [],
						"content": [],
					},
				}
				errors = sorted(validator.iter_errors(submission), key=lambda e: e.path)
				for error in errors:
					path = error.path.popleft()
					error_messages["fieldErrors"][path].append(error.message)
					print(path, error.message)

				return {
					"status": "error",
					"errors": error_messages,
					"submission": submission,
				}
	else:
		posts = query_db("SELECT * from Post")
		return {
			"posts": posts
		}

@app.route("/posts/new")
def new_post():
	return {
		"status": "idle",
	}