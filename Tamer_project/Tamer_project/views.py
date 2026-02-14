from django.urls import path 
from django.shortcuts import render 
from django.http import JsonResponse
import pandas as pd

from django.views.decorators.csrf import csrf_exempt
def home(request):

    

    return render(request , "../templates/home.html")
@csrf_exempt  
def load_signal(request):
    import pandas as pd

    df = pd.read_csv(request.FILES["file"])  
    time = df.iloc[:, 0].tolist()

    if df.shape[1] == 2:
        # single-channel
        signal = df.iloc[:, 1].tolist()
    else:
        # multi-channel
        signal = {}
        for col in df.columns[1:]:
            signal[col] = df[col].tolist()

    data = {
        "time": time,
        "signal": signal
    }
    return JsonResponse(data)
