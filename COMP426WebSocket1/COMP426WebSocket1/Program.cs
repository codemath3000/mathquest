using Microsoft.Web.WebSockets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Threading;

namespace COMP426WebSocket1
{
    internal class Program
    {
        public static SynchronizationContext context;
        public static void Main(string[] args)
        {
            context = SynchronizationContext.Current;
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://[SERVER IP ADDRESS HERE]:8080/");
            listener.Start();
            System.Timers.Timer timer = new System.Timers.Timer();
            timer.Interval = 1000;
            timer.Elapsed += WSUtils.RunRecurring;
            timer.AutoReset = true;
            timer.Start();
            while (true)
            {
                HttpListenerContext context = listener.GetContext();
                if (context.Request.IsWebSocketRequest)
                {
                    HttpListenerWebSocketContext webSocketContext = context.AcceptWebSocketAsync(null).GetAwaiter().GetResult();
                    WebSocket webSocket = webSocketContext.WebSocket;
                    WSUtils.RunWS(webSocket);
                }
            }
        }
    }
}
