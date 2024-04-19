import sqlite3
from typing import Callable
from cuid2 import cuid_wrapper

cuid_generator: Callable[[], str] = cuid_wrapper()

DATABASE = './db/dev.db'

def create_connection(db_file):
	""" create a database connection to the SQLite database
		specified by db_file
	:param db_file: database file
	:return: Connection object or None
	"""
	conn = None
	try:
		conn = sqlite3.connect(db_file)
		return conn
	except Error as e:
		print(e)

	return conn

def create_table(conn, create_table_sql):
	""" create a table from the create_table_sql statement
	:param conn: Connection object
	:param create_table_sql: a CREATE TABLE statement
	:return:
	"""
	try:
		c = conn.cursor()
		c.execute(create_table_sql)
	except Error as e:
		print(e)

def create_post(conn, post):
	"""
	Create a new post
	:param conn:
	:param post:
	:return:
	"""

	sql = ''' INSERT INTO Post(id, title, tags, content)
			  VALUES(?,?,?,?) '''
	cur = conn.cursor()
	cur.execute(sql, post)
	conn.commit()
	return cur.lastrowid

def main():
	# create a database connection
	conn = create_connection(DATABASE)

	sql_create_posts_table = """CREATE TABLE IF NOT EXISTS "Post" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"title" TEXT NOT NULL,
		"tags" TEXT,
		"content" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);"""

	# create tables
	if conn is not None:
		# create posts table
		create_table(conn, sql_create_posts_table)
		create_post(conn, (cuid_generator(), "Post 1", "tag 1,tag 2,tag 3", "Lorem ipsum"))
		create_post(conn, (cuid_generator(), "Post 2", "tag 1", "Lorem ipsum"))
	else:
		print("Error! cannot create the database connection.")


if __name__ == "__main__":
	main()