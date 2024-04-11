document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document.querySelector("#inbox").addEventListener("click", () => load_mailbox("inbox"));
  document.querySelector("#sent").addEventListener("click", () => load_mailbox("sent"));
  document.querySelector("#archived").addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // adding event listener to the emails-view div to listen for a click to view an email
  document.querySelector("#emails-view").addEventListener("click", view_email);

  // By default, load the inbox
  load_mailbox("inbox");

  // add an event listener to the compsition submit button
  // Sending a message
  document.querySelector("#compose-form").addEventListener("submit", (event) => {
      // console.log(document.querySelector("#send"));
      // console.log(document.querySelector("#compose-recipients").value)
      // console.log(document.querySelector("#compose-subject").value)
      // console.log(document.querySelector("#compose-body").value);
      // event.preventDefault()

      fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
          recipients: document.querySelector("#compose-recipients").value,
          subject: document.querySelector("#compose-subject").value,
          body: document.querySelector("#compose-body").value,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          // Print result
          console.log(result);
        })
        .catch((error) => {
          // information about the error if server goes down or could request(sending email)
          console.log(error);
        });
    });
});

// view an email
function view_email(event) {
  const element = event.target;

  let get_email = (email_id) => {
    fetch(`/emails/${email_id}`)
      .then((response) => response.json())
      .then((email) => {
        // console.log(email)

        // Show email view and hide other views
        document.querySelector("#emails-view").style.display = "none";
        document.querySelector("#compose-view").style.display = "none";
        document.querySelector("#email-view").style.display = "block";

        // fill out email view fields
        document.querySelector("#email-sender").value = email.sender;
        document.querySelector("#email-recipients").value = email.recipients;
        document.querySelector("#email-subject").value = email.subject;
        document.querySelector("#email-timestamp").value = email.timestamp;
        document.querySelector("#email-body").value = email.body;
        document
          .querySelector("#reply")
          .setAttribute("data-email_id", `${email.id}`);

        if (email.archived === true) {
          document.querySelector("#archive").value = "Unarchive";
        } else {
          document.querySelector("#archive").value = "Archive";
        }

        // mark the email as readed
        fetch(`/emails/${email_id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      })
      .catch((error) => {
        // information about the error if server goes down or could request(valid mailbox)
        console.log(error);
      });

    // event listener on archive
    document.querySelector("#archive").addEventListener("click", archive);

    function archive(event) {
      const element = event.target;

      if (element.type === "submit") {
        if (element.value === "Archive") {
          // mark the email as archive
          console.log(email_id);
          fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: true,
            }),
          }).catch((error) => {
            // information about the error if server goes down or could request(valid mailbox)
            console.log(error);
          });
        } else if (element.value === "Unarchive") {
          // mark the email as unarchive
          fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: false,
            }),
          }).catch((error) => {
            // information about the error if server goes down or could request(valid mailbox)
            console.log(error);
          });
        }
        // load_mailbox('inbox');
      }
    }

    // event listener on reply
    document.querySelector("#reply").addEventListener("click", reply);

    function reply(event) {
      const element = event.target;

      if (element.type === "submit") {
        if (element.value === "Reply") {
          const email_id = element.dataset.email_id;

          fetch(`/emails/${email_id}`)
            .then((response) => response.json())
            .then((email) => {
              // Show compose view and hide other views
              document.querySelector("#emails-view").style.display = "none";
              document.querySelector("#compose-view").style.display = "block";
              document.querySelector("#email-view").style.display = "none";

              document.querySelector("#compose-recipients").value =
                email.sender;
              if (email.subject.slice(0, 3) === "Re:") {
                document.querySelector("#compose-subject").value =
                  email.subject;
              } else {
                document.querySelector(
                  "#compose-subject"
                ).value = `Re: ${email.subject}`;
              }
              document.querySelector(
                "#compose-body"
              ).value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
            });
        }
      }
    }
  };

  if (parseInt(element.dataset.email_id)) {
    // console.log('element');
    get_email(parseInt(element.dataset.email_id));
  } else if (parseInt(element.parentElement.dataset.email_id)) {
    // console.log('parent element');
    get_email(parseInt(element.parentElement.dataset.email_id));
  } else if (parseInt(element.parentElement.parentElement.dataset.email_id)) {
    get_email(parseInt(element.parentElement.parentElement.dataset.email_id));
  } else if (
    parseInt(element.parentElement.parentElement.parentElement.dataset.email_id)
  ) {
    get_email(
      parseInt(
        element.parentElement.parentElement.parentElement.dataset.email_id
      )
    );
  }
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  const emails_view = document.querySelector("#emails-view");
  const compose_view = document.querySelector("#compose-view");
  const email_view = document.querySelector("#email-view");
  emails_view.style.display = "block";
  compose_view.style.display = "none";
  email_view.style.display = "none";

  // Show the mailbox name
  emails_view.innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Show the emails of inbox, sent and archive
  if (mailbox === "inbox" || mailbox === "sent" || mailbox === "archive") {
    fetch(`/emails/${mailbox}`)
      .then((response) => response.json())
      .then((emails) => {
        // console.log(emails)
        emails.forEach((email) => {
          const div = document.createElement("div");
          div.id = "email";
          div.setAttribute("data-email_id", `${email.id}`);
          div.setAttribute(
            "class",
            "d-flex align-items-center p-1 justify-content-between"
          );

          const email_info = document.createElement("div");
          email_info.id = "email-info-inbox";
          email_info.setAttribute(
            "class",
            "d-flex flex-grow-1 bd-highlight align-items-center justify-content-between"
          );

          const email_sender = document.createElement("div");
          email_sender.id = "email-sender-inbox";

          const email_subject = document.createElement("div");
          email_subject.id = "email-subject-inbox";
          email_subject.setAttribute("class", "flex-grow-1 ml-2 bd-highlight");

          const email_date = document.createElement("div");
          email_date.id = "email-date";

          const sender = document.createElement("strong");
          sender.id = "sender";
          sender.innerHTML = email.sender;

          const subject = document.createElement("p");
          subject.id = "subject";
          subject.innerHTML = email.subject;
          subject.setAttribute("class", "d-block text-truncate");
          subject.style.maxWidth = "400px";

          const date = document.createElement("span");
          // date.id = 'email_date';
          date.innerHTML = email.timestamp;
          date.style.color = "gray";

          const email_action = document.createElement("div");
          email_action.id = "email-action";

          const archive_btn = document.createElement("button");
          if (email.archive === true) {
            archive_btn.innerHTML = "Unarchive";
            archive_btn.id = "unarchive-inbox";
          } else {
            archive_btn.innerHTML = "Archive";
            archive_btn.id = "archive-inbox";
          }
          archive_btn.setAttribute("class", "btn btn-outline-secondary");

          if (email.read === true) {
            div.style.background = "gray";
            date.style.color = "black";
          }

          if (mailbox === "sent") {
            // email_action.style.display = 'none';
            document.querySelector("#archive").style.display = "none";
            document.querySelector("#reply").style.display = "none";
          }

          email_action.append(archive_btn);
          email_sender.append(sender);
          email_subject.append(subject);
          email_info.append(email_sender);
          email_info.append(email_subject);
          email_date.append(date);
          div.append(email_info);
          div.append(email_date);
          emails_view.append(div);
          emails_view.append(email_action);
        });
      })
      .catch((error) => {
        // information about the error if server goes down or could request(valid mailbox)
        console.log(error);
      });
  } else {
    fetch(`/emails/${mailbox}`)
      .then((response) => response.json())
      .then((invalid_mailbox) => {
        console.log(invalid_mailbox);
      })
      .catch((error) => {
        // information about the error if server goes down or could request(invalid mailbox)
        console.log(error);
      });
  }
}
