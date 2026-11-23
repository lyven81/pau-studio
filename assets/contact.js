// Pau Studio enquiry form: sends to FormSubmit and shows success only when
// FormSubmit confirms receipt. The same submission_id is reused on retry.
(function () {
  const ENDPOINT = 'https://formsubmit.co/ajax/admin@pauanalytics.com';
  const form = document.getElementById('enquiry');
  if (!form) return;
  const status = document.getElementById('status');
  const button = form.querySelector('button[type=submit]');
  const newId = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  let submissionId = newId();

  function say(text, cls) { status.textContent = text; status.className = cls || ''; }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    if (fd.get('website')) { say('Thank you. We have received your enquiry.', 'ok'); form.reset(); return; } // spam trap
    const body = {
      business: fd.get('business'), contact: fd.get('contact'), format: fd.get('format'), brief: fd.get('brief'),
      source_page: form.dataset.source || 'contact',
      campaign: new URLSearchParams(location.search).get('campaign') || '',
      brand: 'pau-studio',
      submission_id: submissionId,
      _subject: 'New Pau Studio enquiry',
      _template: 'table'
    };
    button.disabled = true;
    say('Sending…');
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && String(j.success).toLowerCase() === 'true') {   // FormSubmit sends "false" as text on failure
        say('Thank you. We have received your enquiry and will reply soon.', 'ok');
        form.reset();
        submissionId = newId();
      } else {
        say('Your enquiry was not sent. Please try again, or contact us by WhatsApp or email below.', 'err');
      }
    } catch (e) {
      say('Your enquiry was not sent. Please check your connection and try again, or contact us by WhatsApp or email below.', 'err');
    } finally {
      button.disabled = false;
    }
  });
})();
