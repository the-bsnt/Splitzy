Perfect! You've successfully installed the Argon2 packages. These are actually **desired packages** for Django password hashing, not wrong packages.

## What You Just Installed:

- **argon2-cffi** - Modern, secure password hashing algorithm
- **argon2-cffi-bindings** - Required bindings for argon2-cffi
- **cffi** & **pycparser** - Dependencies for the above

## This is Actually Good!

These packages are used by Django for secure password hashing. In fact, since Django 3.2, Argon2 is the **default password hasher**.

## To Configure Django to Use Argon2:

In your `settings.py`, make sure you have:

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
```

## If You Really Want to Remove Them:

```bash
pip uninstall argon2-cffi argon2-cffi-bindings
```

But I'd recommend keeping them as they provide better security for your Django application's user passwords!
