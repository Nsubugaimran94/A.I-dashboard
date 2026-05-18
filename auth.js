const supabaseUrl = "https://qzhiseywodahrtqcdtpe.supabase.co/rest/v1/";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGlzZXl3b2RhaHJ0cWNkdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDgxMDgsImV4cCI6MjA5NDQyNDEwOH0.8ApFcHsPCtN0Tdp1uWyIDahHgeT_mO6bB6yi5hVjKKo";

const supabaseClient =
    supabase.createClient(supabaseUrl, supabaseKey);

async function signUp() {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,
            password: password

        });

    if(error) {

        alert(error.message);

    } else {

        alert("Signup successful!");
        document.getElementById("dashboard")
    .style.display = "block";

    }
}

async function login() {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });

    if(error) {

        alert(error.message);

    } else {

        alert("Login successful!");

    }
}