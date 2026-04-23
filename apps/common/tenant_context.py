import threading

_thread_locals = threading.local()

def set_current_organisation(organisation):
    _thread_locals.organisation = organisation

def get_current_organisation():
    return getattr(_thread_locals, "organisation", None)
