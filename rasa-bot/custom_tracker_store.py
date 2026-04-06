# custom_tracker_store.py
from rasa.core.tracker_store import SQLTrackerStore
from rasa.shared.core.trackers import EventVerbosity
from typing import Text, Dict, Any, Optional, List
import time
import csv
import os
from datetime import datetime

class TimedSQLTrackerStore(SQLTrackerStore):
    def __init__(self, domain, **kwargs):
        super().__init__(domain, **kwargs)
        self.init_response_time_log()

    def init_response_time_log(self):
        self.log_file = "response_times_detailed.csv"
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp', 'conversation_id', 'user_message', 
                    'intent', 'confidence', 'bot_response', 'total_response_time_ms', 'coverage'
                ])

    async def save(self, tracker):
        
        await super().save(tracker)
        
        events = tracker.events
        user_event = None
        bot_event = None
        
        for event in reversed(events):
            event_type = event.type_name if hasattr(event, 'type_name') else str(type(event))
            
            if event_type == 'user' and user_event is None:
                user_event = {
                    'text': event.text if hasattr(event, 'text') else '',
                    'timestamp': event.timestamp if hasattr(event, 'timestamp') else 0,
                    'intent': event.intent.get('name') if hasattr(event, 'intent') and event.intent else '',
                    'confidence': event.intent.get('confidence') if hasattr(event, 'intent') and event.intent else 0
                }
            
            elif event_type == 'bot' and bot_event is None:
                bot_event = {
                    'text': event.text if hasattr(event, 'text') else '',
                    'timestamp': event.timestamp if hasattr(event, 'timestamp') else 0
                }
            
            if user_event and bot_event:
                break
        
        if user_event and bot_event:
            total_response_time = (bot_event.get('timestamp', 0) - user_event.get('timestamp', 0)) * 1000

            is_fallback = user_event.get("intent") in ["nlu_fallback", "out_of_scope"]

            coverage = 0 if is_fallback else 1
            
            with open(self.log_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.now().isoformat(),
                    tracker.sender_id,
                    user_event.get('text', ''),
                    user_event.get('intent', ''),
                    user_event.get('confidence', 0),
                    bot_event.get('text', ''),
                    f"{total_response_time:.2f}",
                    coverage
                ])