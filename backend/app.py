import os
import secrets
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import pymongo
import bcrypt
import smtplib
import ssl


load_dotenv()

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)


MONGO_URI = os.getenv('MONGO_URI') or 'mongodb+srv://dhanuprakashreddy:Alavala2003@cluster0.bedosvm.mongodb.net/'
MONGO_DB = os.getenv('MONGO_DB', 'test')

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]
admins = db.admins
students = db.students


try:
    admins.create_index('adminId', unique=True)
    admins.create_index('email', unique=True)
    students.create_index('studentId', unique=True)
    students.create_index('email', unique=True)
except Exception as e:
    logging.warning('Could not create indexes: %s', e)


@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    data = request.get_json() or {}
    adminId = data.get('adminId')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not (adminId and email and password):
        return jsonify({'message': 'adminId, email and password are required.'}), 400

    try:
        if admins.find_one({'adminId': adminId}):
            return jsonify({'message': 'This Admin ID is already taken. Please choose a different one.'}), 400
        if admins.find_one({'email': email}):
            return jsonify({'message': 'An account with this email already exists.'}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        admin_doc = {
            'adminId': adminId,
            'name': name,
            'email': email,
            'phone': phone,
            'password': hashed.decode('utf-8')
        }
        admins.insert_one(admin_doc)
        return jsonify({'message': 'Admin registered successfully.'}), 201
    except Exception as e:
        logging.exception('Signup error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/signin', methods=['POST'])
def admin_signin():
    data = request.get_json() or {}
    adminId = data.get('adminId')
    password = data.get('password')

    if not (adminId and password):
        return jsonify({'message': 'adminId and password are required.'}), 400

    try:
        admin = admins.find_one({'adminId': adminId})
        if not admin:
            return jsonify({'message': 'Invalid credentials.'}), 400
        stored_hash = admin.get('password')
        if not stored_hash:
            return jsonify({'message': 'Invalid credentials.'}), 400
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            
            token = secrets.token_urlsafe(24)
            from datetime import datetime, timedelta
            expiry = datetime.utcnow() + timedelta(minutes=30)
            admins.update_one({'_id': admin['_id']}, {'$set': {'session_token': token, 'session_expiry': expiry}})
            return jsonify({'message': 'Sign in successful.', 'token': token, 'expiry': expiry.isoformat()}), 200
        else:
            return jsonify({'message': 'Invalid credentials.'}), 400
    except Exception as e:
        logging.exception('Signin error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/forgot-password', methods=['POST'])
def admin_forgot_password():
    data = request.get_json() or {}
    adminId = data.get('adminId')
    email = data.get('email')

    if not adminId or not email:
        return jsonify({'message': 'Admin ID and Email are required.'}), 400

    try:
        admin = admins.find_one({'adminId': adminId, 'email': email})
        if not admin:
            return jsonify({'message': 'No matching admin found.'}), 400


        temp_password = secrets.token_hex(6)
        hashed = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())

        admins.update_one({'_id': admin['_id']}, {'$set': {'password': hashed.decode('utf-8')}})

        
        smtp_host = os.getenv('SMTP_HOST')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        smtp_from = os.getenv('SMTP_FROM') or smtp_user
        smtp_secure = os.getenv('SMTP_SECURE', 'false').lower() == 'true'

        mail_sent = False
        if smtp_host and smtp_user and smtp_pass:
            try:
                message = f"From: {smtp_from}\r\nTo: {email}\r\nSubject: Admin Password Reset\r\n\r\nYour temporary password is: {temp_password}\nPlease sign in and change your password immediately."

                if smtp_secure:
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)
                else:
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.starttls(context=ssl.create_default_context())
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)

                mail_sent = True
            except Exception as e:
                logging.exception('Error sending forgot-password email:')

        if mail_sent:
            return jsonify({'message': 'A temporary password has been sent to your email address.'}), 200

        logging.info('Temporary password for %s: %s', email, temp_password)
        if request.args.get('debug') == '1':
            return jsonify({'message': 'Temporary password generated.', 'tempPassword': temp_password}), 200
        if os.getenv('DEV_RETURN_TEMP', 'false').lower() == 'true':
            return jsonify({'message': 'Temporary password generated.', 'tempPassword': temp_password}), 200
        return jsonify({'message': 'Temporary password generated.'}), 200

    except Exception as e:
        logging.exception('Forgot-password error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/student/signup', methods=['POST'])
def student_signup():
    data = request.get_json() or {}
    studentId = data.get('studentId')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not (studentId and email and password):
        return jsonify({'message': 'studentId, email and password are required.'}), 400

    try:
        if students.find_one({'studentId': studentId}):
            return jsonify({'message': 'This Student ID is already taken.'}), 400
        if students.find_one({'email': email}):
            return jsonify({'message': 'An account with this email already exists.'}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        student_doc = {
            'studentId': studentId,
            'name': name,
            'email': email,
            'phone': phone,
            'password': hashed.decode('utf-8'),
            
            'temp_password_hash': None,
            'temp_password_expiry': None
        }
        students.insert_one(student_doc)
        return jsonify({'message': 'Student registered successfully.'}), 201
    except Exception as e:
        logging.exception('Student signup error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/student/signin', methods=['POST'])
def student_signin():
    data = request.get_json() or {}
    studentId = data.get('studentId')
    password = data.get('password')

    if not (studentId and password):
        return jsonify({'message': 'studentId and password are required.'}), 400

    try:
        student = students.find_one({'studentId': studentId})
        if not student:
            return jsonify({'message': 'Invalid credentials.'}), 400
        stored_hash = student.get('password')
        if not stored_hash:
            return jsonify({'message': 'Invalid credentials.'}), 400
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return jsonify({'message': 'Sign in successful.'}), 200
        else:
            return jsonify({'message': 'Invalid credentials.'}), 400
    except Exception as e:
        logging.exception('Student signin error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/student/forgot-password', methods=['POST'])
def student_forgot_password():
    data = request.get_json() or {}
    studentId = data.get('studentId')
    email = data.get('email')

    if not studentId or not email:
        return jsonify({'message': 'Student ID and Email are required.'}), 400

    try:
        student = students.find_one({'studentId': studentId, 'email': email})
        if not student:
            return jsonify({'message': 'No matching student found.'}), 400

        
        temp_password = secrets.token_urlsafe(8)
        hashed = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())
        from datetime import datetime, timedelta
        expiry = datetime.utcnow() + timedelta(minutes=15)

        students.update_one({'_id': student['_id']}, {'$set': {
            'temp_password_hash': hashed.decode('utf-8'),
            'temp_password_expiry': expiry
        }})

        
        smtp_host = os.getenv('SMTP_HOST')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        smtp_from = os.getenv('SMTP_FROM') or smtp_user
        smtp_secure = os.getenv('SMTP_SECURE', 'false').lower() == 'true'

        mail_sent = False
        if smtp_host and smtp_user and smtp_pass:
            try:
                message = f"From: {smtp_from}\r\nTo: {email}\r\nSubject: Student Password Reset\r\n\r\nYour temporary password is: {temp_password}\nThis temporary password will expire in 15 minutes. Please sign in and change your password immediately."

                if smtp_secure:
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)
                else:
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.starttls(context=ssl.create_default_context())
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)

                mail_sent = True
            except Exception:
                logging.exception('Error sending student forgot-password email:')

        if mail_sent:
            return jsonify({'message': 'A temporary password has been sent to your email address.'}), 200

        logging.info('Temporary password for %s: %s', email, temp_password)
        return jsonify({'message': 'Temporary password generated.'}), 200

    except Exception as e:
        logging.exception('Student forgot-password error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/student/reset-password', methods=['POST'])
def student_reset_password():
    data = request.get_json() or {}
    studentId = data.get('studentId')
    temp_password = data.get('tempPassword')
    new_password = data.get('newPassword')

    if not (studentId and temp_password and new_password):
        return jsonify({'message': 'studentId, tempPassword and newPassword are required.'}), 400

    try:
        from datetime import datetime
        student = students.find_one({'studentId': studentId})
        if not student:
            return jsonify({'message': 'Invalid student ID or temporary password.'}), 400

        temp_hash = student.get('temp_password_hash')
        expiry = student.get('temp_password_expiry')
        if not temp_hash or not expiry:
            return jsonify({'message': 'No temporary password set for this account.'}), 400


        if isinstance(expiry, str):
            try:
                expiry_dt = datetime.fromisoformat(expiry)
            except Exception:
                expiry_dt = datetime.strptime(expiry, '%Y-%m-%d %H:%M:%S.%f')
        else:
            expiry_dt = expiry

        if datetime.utcnow() > expiry_dt:
            return jsonify({'message': 'Temporary password has expired.'}), 400

        if not bcrypt.checkpw(temp_password.encode('utf-8'), temp_hash.encode('utf-8')):
            return jsonify({'message': 'Invalid temporary password.'}), 400

        
        new_hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        students.update_one({'_id': student['_id']}, {'$set': {
            'password': new_hashed.decode('utf-8'),
            'temp_password_hash': None,
            'temp_password_expiry': None
        }})

        return jsonify({'message': 'Password reset successful. You can now sign in with your new password.'}), 200
    except Exception as e:
        logging.exception('Student reset-password error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/students', methods=['GET'])
def admin_list_students():
    try:
        # auth check
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'message': 'Unauthorized'}), 401
        token = auth.split(' ', 1)[1]
        admin = admins.find_one({'session_token': token})
        from datetime import datetime
        if not admin or not admin.get('session_expiry') or datetime.utcnow() > admin.get('session_expiry'):
            return jsonify({'message': 'Unauthorized or session expired'}), 401
        
        docs = students.find({}, {'password': 0, 'temp_password_hash': 0})
        out = []
        for d in docs:
            d['_id'] = str(d.get('_id'))
            out.append(d)
        return jsonify({'students': out}), 200
    except Exception as e:
        logging.exception('Admin students list error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/send-temp-password', methods=['POST'])
def admin_send_temp_password():
    # auth
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'message': 'Unauthorized'}), 401
    token = auth.split(' ', 1)[1]
    admin = admins.find_one({'session_token': token})
    from datetime import datetime
    if not admin or not admin.get('session_expiry') or datetime.utcnow() > admin.get('session_expiry'):
        return jsonify({'message': 'Unauthorized or session expired'}), 401

    data = request.get_json() or {}
    studentId = data.get('studentId')

    if not studentId:
        return jsonify({'message': 'studentId is required.'}), 400

    try:
        student = students.find_one({'studentId': studentId})
        if not student:
            return jsonify({'message': 'Student not found.'}), 404

        
        email = student.get('email')
        temp_password = secrets.token_urlsafe(8)
        hashed = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())
        from datetime import datetime, timedelta
        expiry = datetime.utcnow() + timedelta(minutes=15)

        students.update_one({'_id': student['_id']}, {'$set': {
            'temp_password_hash': hashed.decode('utf-8'),
            'temp_password_expiry': expiry
        }})

        smtp_host = os.getenv('SMTP_HOST')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        smtp_from = os.getenv('SMTP_FROM') or smtp_user
        smtp_secure = os.getenv('SMTP_SECURE', 'false').lower() == 'true'

        mail_sent = False
        if smtp_host and smtp_user and smtp_pass and email:
            try:
                message = f"From: {smtp_from}\r\nTo: {email}\r\nSubject: Student Password Reset\r\n\r\nYour temporary password is: {temp_password}\nThis temporary password will expire in 15 minutes. Please sign in and change your password immediately."

                if smtp_secure:
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)
                else:
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.starttls(context=ssl.create_default_context())
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_from, [email], message)

                mail_sent = True
            except Exception:
                logging.exception('Error sending admin temp-password email:')

        if mail_sent:
            return jsonify({'message': 'A temporary password has been sent to the student email.'}), 200

        logging.info('Temporary password for %s: %s', email, temp_password)
        if request.args.get('debug') == '1':
            return jsonify({'message': 'Temporary password generated and logged.', 'tempPassword': temp_password}), 200
        if os.getenv('DEV_RETURN_TEMP', 'false').lower() == 'true':
            return jsonify({'message': 'Temporary password generated and logged.', 'tempPassword': temp_password}), 200
        return jsonify({'message': 'Temporary password generated and logged.'}), 200
    except Exception as e:
        logging.exception('Admin send-temp-password error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/students', methods=['POST'])
def admin_create_student():
    # auth
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'message': 'Unauthorized'}), 401
    token = auth.split(' ', 1)[1]
    admin = admins.find_one({'session_token': token})
    from datetime import datetime
    if not admin or not admin.get('session_expiry') or datetime.utcnow() > admin.get('session_expiry'):
        return jsonify({'message': 'Unauthorized or session expired'}), 401

    data = request.get_json() or {}

    studentId = data.get('studentId')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')

    if not (studentId and email):
        return jsonify({'message': 'studentId and email are required.'}), 400

    try:
        if students.find_one({'studentId': studentId}):
            return jsonify({'message': 'This Student ID is already taken.'}), 400
        if students.find_one({'email': email}):
            return jsonify({'message': 'An account with this email already exists.'}), 400

        student_doc = {
            'studentId': studentId,
            'name': name,
            'email': email,
            'phone': phone,
            'password': None,
            'temp_password_hash': None,
            'temp_password_expiry': None
        }
        students.insert_one(student_doc)
        return jsonify({'message': 'Student created successfully.'}), 201
    except Exception as e:
        logging.exception('Admin create student error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/students/<studentId>', methods=['PUT'])
def admin_update_student(studentId):
    # auth
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'message': 'Unauthorized'}), 401
    token = auth.split(' ', 1)[1]
    admin = admins.find_one({'session_token': token})
    from datetime import datetime
    if not admin or not admin.get('session_expiry') or datetime.utcnow() > admin.get('session_expiry'):
        return jsonify({'message': 'Unauthorized or session expired'}), 401

    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    try:
        student = students.find_one({'studentId': studentId})
        if not student:
            return jsonify({'message': 'Student not found.'}), 404

        update = {}
        if name is not None:
            update['name'] = name
        if email is not None:
            
            other = students.find_one({'email': email, 'studentId': {'$ne': studentId}})
            if other:
                return jsonify({'message': 'Another account with this email already exists.'}), 400
            update['email'] = email
        if phone is not None:
            update['phone'] = phone
        if password:
            new_hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            update['password'] = new_hashed.decode('utf-8')

        if update:
            students.update_one({'studentId': studentId}, {'$set': update})
        return jsonify({'message': 'Student updated successfully.'}), 200
    except Exception as e:
        logging.exception('Admin update student error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


@app.route('/api/admin/students/<studentId>', methods=['DELETE'])
def admin_delete_student(studentId):
    
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'message': 'Unauthorized'}), 401
    token = auth.split(' ', 1)[1]
    admin = admins.find_one({'session_token': token})
    from datetime import datetime
    if not admin or not admin.get('session_expiry') or datetime.utcnow() > admin.get('session_expiry'):
        return jsonify({'message': 'Unauthorized or session expired'}), 401

    try:
        res = students.delete_one({'studentId': studentId})
        if res.deleted_count == 0:
            return jsonify({'message': 'Student not found.'}), 404
        return jsonify({'message': 'Student deleted.'}), 200
    except Exception as e:
        logging.exception('Admin delete student error:')
        return jsonify({'message': 'Server error.', 'detail': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
