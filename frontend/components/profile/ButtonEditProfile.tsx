"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { useEffect, useState } from "react";
import { Settings } from "../animate-ui/icons/settings";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function ButtonEditProfile() {
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const { isPending, error, data } = useQuery({
    queryKey: ["profileData", publicKey?.toBase58()],
    queryFn: () =>
      fetch(`/api/profile/read?wallet=${publicKey?.toBase58()}`).then((res) =>
        res.json()
      ),
  });
  const [open, setOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [dataSubmit, setDataSubmit] = useState({
    username: data?.user?.username || "",
    email: data?.user?.email || "",
  });

  useEffect(() => {
    if (data?.user) {
      setDataSubmit({ username: data.user.username, email: data.user.email });
    }
  }, [data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitLoading(true);
    const submit = await fetch("/api/profile/update", {
      method: "POST",
      body: JSON.stringify({ ...dataSubmit, wallet: publicKey?.toBase58() }),
    }).then((res) => res.json());
    if (submit.ok) {
      toast.success(submit.message);
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      setOpen(false);
      setDataSubmit({ username: "", email: "" });
      setIsSubmitLoading(false);
    } else {
      toast.error(submit.error);
      setIsSubmitLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button
            variant="outline"
            size="lg"
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <Settings />
            Settings
          </Button>
        </AnimateIcon>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-5/6">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="username-1">Username</Label>
            <Input
              id="username-1"
              name="username"
              placeholder="@syra_labs"
              value={dataSubmit.username}
              disabled={data?.user?.username}
              onChange={(e) =>
                setDataSubmit({ ...dataSubmit, username: e.target.value })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email-1">Email</Label>
            <Input
              id="email-1"
              name="email"
              disabled={data?.user?.email}
              placeholder="syra_labs@gmail.com"
              value={dataSubmit.email}
              onChange={(e) =>
                setDataSubmit({ ...dataSubmit, email: e.target.value })
              }
            />
          </div>
        </div>
        {!data?.user?.username && !data?.user?.email && (
          <div className="bg-red-50 p-2 rounded-md">
            <p className="text-xs text-red-600">
              Please fill with your username and email, you can't
              change it after you registered
            </p>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              isSubmitLoading || data?.user?.username || data?.user?.email
            }
            className="cursor-pointer"
          >
            {isSubmitLoading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
