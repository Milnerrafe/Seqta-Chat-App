from flask import Flask, request, redirect, render_template_string
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

def scjson(url):
    response = requests.get(url)
    data = response.json()
    return (
        data.get("seqtaAuthUrl", ""),
        data.get("schoolName", ""),
        data.get("presetUrl", ""),
        data.get("schoolImg", ""),
        data.get("backUrl", ""),
        data.get("css-id", ""),
        data.get("seqtaUrl", "")
    )

def getname(cookie):
    url = 'https://student.stgeorges.wa.edu.au/seqta/student/load/forums'
    headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cookie': f"JSESSIONID={cookie}"
    }
    body = {"mode": "list"}
    try:
        response = requests.post(url, json=body, headers=headers, verify=False)
        response.raise_for_status()
        data = response.json()
        return data.get('payload', {}).get('me', 'Error')
    except (requests.RequestException, ValueError) as e:
        print(e)
        return 'Error'

def seqtaauth(seqtaurl, username, password):
    headers = {
        "Accept": "text/javascript, text/html, application/xml, text/xml, */*",
        "Content-Type": "application/json; charset=utf-8"
    }
    payload = {"username": username, "password": password, "mode": "normal", "query": None}
    response = requests.post(seqtaurl, headers=headers, json=payload, verify=False)
    for cookie in response.cookies:
        if cookie.name == 'JSESSIONID':
            return cookie.value
    return None

@app.route("/login")
def login():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)
    return render_template_string(LOGIN_TEMPLATE, schoolname=schoolname, preseturl=preseturl,
                                  schoolimg=schoolimg, cssid=cssid, seqtaurl=seqtaurl, scjsondata=scjsondata)

@app.route("/fail-login")
def fail_login():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)
    return render_template_string(LOGIN_TEMPLATE, schoolname=schoolname, preseturl=preseturl,
                                  schoolimg=schoolimg, cssid=cssid, seqtaurl=seqtaurl, scjsondata=scjsondata,
                                  failed=True)

@app.route("/authenticate", methods=["POST"])
def authenticate():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)
    username = request.form.get('username')
    password = request.form.get('password')
    seqta_cookie = seqtaauth(seqtaauthurl, username, password)
    personname = getname(seqta_cookie)
    if personname == "Error":
        return redirect(f"/fail-login?scjson={scjsondata}")
    return redirect(f"{backurl}?cookie={seqta_cookie}&personname={personname}")

LOGIN_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
    <link rel="stylesheet" href="{{ seqtaurl }}{{ cssid }}/seqtamodules-coneqt.css">
    <link rel="stylesheet" href="{{ seqtaurl }}{{ cssid }}/coneqt.css">
    <link rel="stylesheet" href="{{ seqtaurl }}{{ cssid }}/app.css">
    <link rel="stylesheet" href="{{ seqtaurl }}{{ cssid }}/lib.css">
</head>
<body>
    <div class="login">
        <div class="backdrop" style="background-image: url('{{ schoolimg }}');"></div>
        <div class="branding">
            <a href="https://educationhorizons.com/solutions/seqta/" class="branding" target="_blank">
                <img src="https://student.stgeorges.wa.edu.au/js/images/seqta-reverse.svg" alt="SEQTA" class="seqta">
            </a>
            <img class="productLogo" src="https://student.stgeorges.wa.edu.au/images/logo-learn.svg">
        </div>
        <div class="auth">
            <div class="loginBox">
                <form action="/authenticate?scjson={{ scjsondata }}" method="post">
                    <label>
                        <span>User name</span>
                        <input id="username" name="username" class="uiShortText username" type="text">
                    </label>
                    <label>
                        <span>Password</span>
                        <input id="password" name="password" class="uiShortText password" type="password">
                    </label>
                    <button type="submit" class="uiButton">Log in</button>
                </form>
            </div>
            {% if failed %}
            <div class="invalidCredentials shown">The user name or password you entered doesn’t match our records.</div>
            {% endif %}
            <div class="siteName">{{ schoolname }}</div>
            <div class="reset">
                <a target="_blank" href="{{ preseturl }}">Forgot your password?</a>
            </div>
        </div>
    </div>
</body>
</html>
'''

if __name__ == "__main__":
    app.run(debug=True)
