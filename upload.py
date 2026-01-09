import base64

with open("/Users/arkarmin/Downloads/images/wp7041166-golang-wallpapers.jpg", "rb") as f:
    base64_bytes = base64.b64encode(f.read())
    base64_string = base64_bytes.decode("utf-8")

print(base64_string)
