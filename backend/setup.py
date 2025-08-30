from setuptools import setup, find_packages

setup(
    name="gaming-parlour-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        line.strip() for line in open('requirements-prod.txt')
        if line.strip() and not line.startswith('#')
    ],
    python_requires='>=3.8',
)
