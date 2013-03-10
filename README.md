jquery.pslidate.js
=====

Pub sub validation for your bootstrap forms!

Usage
=====

So, you first build your markup of your form, following the Bootstrap style.
Then you define the validation rules in the markup of your controls like: `<input data-pslidate="text" type="text" ... >`
You also can define your custom error messages with the `pslerror` data attribute: `<input data-pslerror="Please write your address" type="text" ... >`

Finally you can validate your form

```JavaScript
$('#my-form').on('submit', function () {
    var isValid = $(this).pslidate();

    if( isValid ) {
        console.log('ajax call maybe?');
    }

});
```

Why?
====

Well, I just wanted to liberate the code I use in my day to day work.
Maybe it will get better on every commit.
