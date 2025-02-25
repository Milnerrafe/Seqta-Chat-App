from flask import Flask, request, render_template, redirect, url_for
import requests
import urllib3


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def scjson(url):
    response = requests.get(url)

    data = response.json()

    seqtaauthurl = data.get("seqtaAuthUrl", "")
    schoolname = data.get("schoolName", "")
    preseturl = data.get("presetUrl", "")
    schoolimg = data.get("schoolImg", "")
    backurl = data.get("backUrl", "")
    cssid = data.get("css-id", "")
    seqtaurl = data.get("seqtaUrl", "")

    return seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl


def getname(cookie):
    url = 'https://student.stgeorges.wa.edu.au/seqta/student/load/forums'
    headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cookie': f"JSESSIONID={cookie}"
    }

    body = {
        "mode": "list"
    }

    try:
        response = requests.post(url, json=body, headers=headers, verify=False)
        response.raise_for_status()  # Raise an exception for non-2xx status codes

        # Parse the JSON response
        data = response.json()

        # Check if 'payload' and 'me' exist, otherwise return 'Error'
        name = data.get('payload', {}).get('me', 'Error')

    except (requests.RequestException, ValueError) as e:
        # In case of an error (request or JSON parsing)
        print(e)
        name = 'Error'

    return name

def seqtaauth(seqtaurl, username, password):
    url = seqtaurl

    headers = {
        "Accept": "text/javascript, text/html, application/xml, text/xml, */*",
        "Content-Type": "application/json; charset=utf-8"
    }

    payload = {
        "username": username,
        "password": password,
        "mode": "normal",
        "query": None
    }

    response = requests.post(url, headers=headers, json=payload, verify=False)

    cookie_value = None

    # Loop through the cookies in the response
    for cookie in response.cookies:
        if cookie.name == 'JSESSIONID':
            cookie_value = cookie.value
            break

    return cookie_value


app = Flask(__name__)


@app.route("/login")
def login():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
    <!-- Link to the external CSS files -->
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
                        <input id="username" name="username" class="uiShortText username" placeholder="" type="text" spellcheck="false" size="10" control-id="ControlID-1">
                    </label>
                    <label>
                        <span>Password</span>
                        <input id="password" class="uiShortText password" placeholder="" type="password" name="password" spellcheck="false" size="10" control-id="ControlID-2">
                    </label>
                    <button type="submit" title="" class="uiButton" control-id="ControlID-3">Log in
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path fill="#000" d="M8.578 16.359l4.594-4.594-4.594-4.594 1.406-1.406 6 6-6 6z"></path>
                        </svg>
                    </button>
                </form>
            </div>
            <div class="invalidCredentials"></div>
            <div class="siteName">{{ schoolname }}</div>
            <div class="message"></div>
            <div class="reset">
                <a target="_blank" href="{{ preseturl }}">Forgot your password?</a>
            </div>
            <div class="alternatives"></div>
        </div>
    </div>
</body>
</html>
    ''', seqtaurl=seqtaurl, cssid=cssid, schoolimg=schoolimg, schoolname=schoolname, preseturl=preseturl, scjsondata=scjsondata)

@app.route("/fail-login")
def faillogin():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
    <!-- Link to the external CSS files -->
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
                        <input id="username" name="username" class="uiShortText username" placeholder="" type="text" spellcheck="false" size="10" control-id="ControlID-1">
                    </label>
                    <label>
                        <span>Password</span>
                        <input id="password" class="uiShortText password" placeholder="" type="password" name="password" spellcheck="false" size="10" control-id="ControlID-2">
                    </label>
                    <button type="submit" title="" class="uiButton" control-id="ControlID-3">Log in
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path fill="#000" d="M8.578 16.359l4.594-4.594-4.594-4.594 1.406-1.406 6 6-6 6z"></path>
                        </svg>
                    </button>
                </form>
            </div>
            <div class="invalidCredentials shown">The user name or password you entered doesn't match our records.</div>
            <div class="siteName">{{ schoolname }}</div>
            <div class="message"></div>
            <div class="reset">
                <a target="_blank" href="{{ preseturl }}">Forgot your password?</a>
            </div>
            <div class="alternatives"></div>
        </div>
    </div>
</body>
</html>
    ''', seqtaurl=seqtaurl, cssid=cssid, schoolimg=schoolimg, schoolname=schoolname, preseturl=preseturl, scjsondata=scjsondata)

# Handle login form submission, generate cookie, and redirect back
@app.route("/authenticate", methods=["POST"])
def authenticate():
    scjsondata = request.args.get("scjson")
    seqtaauthurl, schoolname, preseturl, schoolimg, backurl, cssid, seqtaurl = scjson(scjsondata)

    username = request.form.get('username')
    password = request.form.get('password')
    seqta_cookie = seqtaauth(seqtaauthurl, username, password)
    personname = getname(seqta_cookie)

    if personname == "Error":
        redirect_url = f"/fail-login?scjson={scjsondata}"
    else:
        redirect_url = f"{backurl}?cookie={seqta_cookie}&personname={personname}"

    return redirect(redirect_url)


def render_template_string(template_string, **context):
    """Simple implementation of a template renderer to mimic the original code structure"""
    for key, value in context.items():
        template_string = template_string.replace('{{ ' + key + ' }}', str(value))
    return template_string


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8000)
