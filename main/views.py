from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect

import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings'

def home(request, *args):
    return render_to_response('index.html')